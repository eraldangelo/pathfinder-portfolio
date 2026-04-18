#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULTS = {
  project: 'your-gcp-project',
  region: 'asia-southeast1',
  service: 'pathfinder',
  database: '(default)',
  baseUrl: 'https://your-app.example.com/',
  allowAppCheckUnenforced: false,
  allowTtlCreating: false,
};

const REQUIRED_SECRET_ENV_NAMES = ['FIREBASE_ADMIN_SDK_JSON', 'TURNSTILE_SECRET_KEY'];
const REQUIRED_IAM_ROLES = ['roles/datastore.user', 'roles/secretmanager.secretAccessor'];
const REQUIRED_ALERT_POLICIES = [
  '[Pathfinder] Cloud Run 5xx Error Rate',
  '[Pathfinder] Cloud Run P95 Latency',
  '[Pathfinder] Production Uptime Failure',
];
const REQUIRED_UPTIME_CHECK = '[Pathfinder] prod uptime';
const APPCHECK_SERVICES = [
  'firestore.googleapis.com',
  'firebasestorage.googleapis.com',
  'identitytoolkit.googleapis.com',
];

const parseArgs = () => {
  const out = { ...DEFAULTS };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--allow-app-check-unenforced') out.allowAppCheckUnenforced = true;
    if (arg === '--allow-ttl-creating') out.allowTtlCreating = true;
    if (arg.startsWith('--project=')) out.project = arg.split('=')[1];
    if (arg.startsWith('--region=')) out.region = arg.split('=')[1];
    if (arg.startsWith('--service=')) out.service = arg.split('=')[1];
    if (arg.startsWith('--database=')) out.database = arg.split('=')[1];
    if (arg.startsWith('--base-url=')) out.baseUrl = arg.split('=')[1];
  }
  try {
    new URL(out.baseUrl);
  } catch {
    throw new Error(`Invalid --base-url value "${out.baseUrl}".`);
  }
  return out;
};

const runCapture = (command, args) => {
  const isWin = process.platform === 'win32';
  const quoteWin = (value) =>
    /[\s"&|<>^]/.test(value) ? `"${String(value).replace(/"/g, '\\"')}"` : String(value);
  const commandLine = isWin ? `${command} ${args.map(quoteWin).join(' ')}` : command;
  const commandArgs = isWin ? [] : args;
  const result = spawnSync(commandLine, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWin,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || '').trim() || `Command failed: ${command} ${args.join(' ')}`);
  }
  return String(result.stdout || '').trim();
};

const runJson = (command, args) => JSON.parse(runCapture(command, [...args, '--format=json']) || 'null');

const getRequiredPublicEnvKeys = () => {
  const envConfigPath = path.join(process.cwd(), 'scripts', 'config', 'env-keys.json');
  const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
  return (envConfig.required || []).filter((key) => key.startsWith('NEXT_PUBLIC_'));
};

const describeCloudRunService = ({ project, region, service }) =>
  runJson('gcloud', ['run', 'services', 'describe', service, '--project', project, '--region', region]);

const extractEnvMaps = (serviceJson) => {
  const envItems = serviceJson?.spec?.template?.spec?.containers?.[0]?.env || [];
  const values = {};
  const secrets = {};
  for (const item of envItems) {
    if (!item?.name) continue;
    if (typeof item.value === 'string') values[item.name] = item.value;
    if (item.valueFrom?.secretKeyRef?.name) {
      secrets[item.name] = `${item.valueFrom.secretKeyRef.name}:${item.valueFrom.secretKeyRef.key || 'latest'}`;
    }
  }
  return { values, secrets };
};

const getServiceAccountRoles = ({ project, serviceAccountEmail }) => {
  const policyRows = runJson('gcloud', [
    'projects',
    'get-iam-policy',
    project,
    '--flatten=bindings[].members',
    `--filter=bindings.members:serviceAccount:${serviceAccountEmail}`,
  ]);
  return new Set((policyRows || []).map((row) => row.bindings?.role).filter(Boolean));
};

const checkTtl = ({ project, database, allowTtlCreating }) => {
  const ttlRows = runJson('gcloud', [
    'firestore',
    'fields',
    'ttls',
    'list',
    '--project',
    project,
    '--database',
    database,
  ]);
  const field = (ttlRows || []).find((row) =>
    String(row?.name || '').endsWith('/collectionGroups/__rateLimits/fields/expiresAt'),
  );
  const state = field?.ttlConfig?.state || 'MISSING';
  const allowStates = allowTtlCreating ? ['ACTIVE', 'CREATING'] : ['ACTIVE'];
  return { ok: allowStates.includes(state), state };
};

const checkAppCheck = async ({ project, allowUnenforced }) => {
  const projectNumber = runCapture('gcloud', ['projects', 'describe', project, '--format=value(projectNumber)']);
  const token = runCapture('gcloud', ['auth', 'print-access-token']);
  const output = [];

  for (const service of APPCHECK_SERVICES) {
    const res = await fetch(
      `https://firebaseappcheck.googleapis.com/v1beta/projects/${projectNumber}/services/${service}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-goog-user-project': project,
        },
      },
    );
    const json = await res.json();
    if (!res.ok) {
      output.push({ service, ok: false, mode: 'ERROR', detail: json?.error?.message || 'request failed' });
      continue;
    }
    const mode = json.enforcementMode || 'UNENFORCED';
    output.push({
      service,
      ok: allowUnenforced ? true : mode === 'ENFORCED',
      mode,
      detail: allowUnenforced ? 'enforcement check bypassed by flag' : '',
    });
  }

  return output;
};

const checkMonitoring = ({ project, baseUrl }) => {
  const expectedHost = new URL(baseUrl).host;
  const uptimeConfigs = runJson('gcloud', ['monitoring', 'uptime', 'list-configs', '--project', project]) || [];
  const policyRows = runJson('gcloud', ['monitoring', 'policies', 'list', '--project', project]) || [];
  const uptimeConfig = uptimeConfigs.find((row) => row.displayName === REQUIRED_UPTIME_CHECK);
  const policyByName = new Map(policyRows.map((row) => [row.displayName, row]));

  const missingPolicies = REQUIRED_ALERT_POLICIES.filter((name) => !policyByName.has(name));
  const presentPolicies = REQUIRED_ALERT_POLICIES
    .map((name) => policyByName.get(name))
    .filter(Boolean);
  const disabledPolicies = presentPolicies
    .filter((policy) => policy.enabled === false)
    .map((policy) => policy.displayName);
  const policiesWithoutChannels = presentPolicies
    .filter((policy) => !Array.isArray(policy.notificationChannels) || policy.notificationChannels.length === 0)
    .map((policy) => policy.displayName);

  const hasUptime = Boolean(uptimeConfig);
  const uptimeHost = String(uptimeConfig?.monitoredResource?.labels?.host || '').trim();
  const uptimePath = String(uptimeConfig?.httpCheck?.path || '').trim();
  const uptimeHostMatches = hasUptime && uptimeHost === expectedHost;
  const uptimePathMatches = hasUptime && uptimePath === '/login';
  return {
    ok:
      hasUptime
      && uptimeHostMatches
      && uptimePathMatches
      && missingPolicies.length === 0
      && disabledPolicies.length === 0
      && policiesWithoutChannels.length === 0,
    hasUptime,
    uptimeHost,
    uptimeHostMatches,
    uptimePath,
    uptimePathMatches,
    missingPolicies,
    disabledPolicies,
    policiesWithoutChannels,
  };
};

async function main() {
  const cfg = parseArgs();
  const requiredPublicEnv = getRequiredPublicEnvKeys();
  const failures = [];

  const serviceJson = describeCloudRunService(cfg);
  const serviceAccount = serviceJson?.spec?.template?.spec?.serviceAccountName || '';
  const { values: runtimeValues, secrets: runtimeSecrets } = extractEnvMaps(serviceJson);

  const missingPublicEnv = requiredPublicEnv.filter((key) => !String(runtimeValues[key] || '').trim());
  if (missingPublicEnv.length > 0) failures.push(`Missing Cloud Run NEXT_PUBLIC_* values: ${missingPublicEnv.join(', ')}`);
  if (String(runtimeValues.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN || '').trim()) {
    failures.push('Production must not set NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN.');
  }

  const missingSecretEnv = REQUIRED_SECRET_ENV_NAMES.filter((key) => !runtimeSecrets[key]);
  if (missingSecretEnv.length > 0) failures.push(`Missing Cloud Run secret bindings: ${missingSecretEnv.join(', ')}`);

  if (!serviceAccount) {
    failures.push('Cloud Run service account is missing on service spec.');
  } else {
    const roles = getServiceAccountRoles({ project: cfg.project, serviceAccountEmail: serviceAccount });
    const hasPowerRole = roles.has('roles/editor') || roles.has('roles/owner');
    const missingRoles = hasPowerRole ? [] : REQUIRED_IAM_ROLES.filter((role) => !roles.has(role));
    if (missingRoles.length > 0) {
      failures.push(`Service account missing IAM roles: ${missingRoles.join(', ')}`);
    }
  }

  const ttl = checkTtl(cfg);
  if (!ttl.ok) failures.push(`Firestore TTL for __rateLimits.expiresAt is not active (state=${ttl.state}).`);

  const appCheckRows = await checkAppCheck({
    project: cfg.project,
    allowUnenforced: cfg.allowAppCheckUnenforced,
  });
  const appCheckFailures = appCheckRows.filter((row) => !row.ok);
  if (appCheckFailures.length > 0) {
    failures.push(
      `App Check services not enforced: ${appCheckFailures.map((row) => `${row.service} (${row.mode})`).join(', ')}`,
    );
  }

  const monitoring = checkMonitoring(cfg);
  if (!monitoring.ok) {
    const bits = [];
    if (!monitoring.hasUptime) bits.push(`missing uptime check "${REQUIRED_UPTIME_CHECK}"`);
    if (monitoring.hasUptime && !monitoring.uptimeHostMatches) {
      bits.push(`uptime check host mismatch (expected ${new URL(cfg.baseUrl).host}, got ${monitoring.uptimeHost || 'empty'})`);
    }
    if (monitoring.hasUptime && !monitoring.uptimePathMatches) {
      bits.push(`uptime check path mismatch (expected /login, got ${monitoring.uptimePath || 'empty'})`);
    }
    if (monitoring.missingPolicies.length > 0) {
      bits.push(`missing policies: ${monitoring.missingPolicies.join(', ')}`);
    }
    if (monitoring.disabledPolicies.length > 0) {
      bits.push(`disabled policies: ${monitoring.disabledPolicies.join(', ')}`);
    }
    if (monitoring.policiesWithoutChannels.length > 0) {
      bits.push(`policies without notification channels: ${monitoring.policiesWithoutChannels.join(', ')}`);
    }
    failures.push(`Monitoring baseline drift: ${bits.join('; ')}`);
  }

  console.log('=== Auto-Verified Controls ===');
  console.log(`Cloud Run service: ${cfg.service} (${cfg.region})`);
  console.log(`Firestore TTL state (__rateLimits.expiresAt): ${ttl.state}`);
  appCheckRows.forEach((row) => console.log(`App Check ${row.service}: ${row.mode}`));
  console.log(`Monitoring uptime check present: ${monitoring.hasUptime ? 'yes' : 'no'}`);
  if (monitoring.hasUptime) {
    console.log(`Monitoring uptime host: ${monitoring.uptimeHost || 'empty'} (${monitoring.uptimeHostMatches ? 'match' : 'mismatch'})`);
    console.log(`Monitoring uptime path: ${monitoring.uptimePath || 'empty'} (${monitoring.uptimePathMatches ? 'match' : 'mismatch'})`);
  }
  console.log(`Monitoring alert policies missing: ${monitoring.missingPolicies.length}`);
  console.log(`Monitoring alert policies disabled: ${monitoring.disabledPolicies.length}`);
  console.log(`Monitoring alert policies without channels: ${monitoring.policiesWithoutChannels.length}`);
  console.log('=== Manual Boundary ===');
  console.log('- Verify on-call escalation targets and notification channel recipients in Google Cloud console.');
  console.log('- Verify App Check rollout readiness across Pathfinder/StudyNavi/Assessment clients before enforcing mode.');

  if (failures.length > 0) {
    console.error('Deploy drift check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Deploy drift check passed.');
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
