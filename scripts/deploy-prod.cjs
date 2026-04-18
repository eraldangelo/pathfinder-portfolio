#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  service: 'pathfinder',
  project: 'your-gcp-project',
  region: 'asia-southeast1',
  imageRepo: 'asia-southeast1-docker.pkg.dev/your-gcp-project/cloud-run-source-deploy/pathfinder',
  appBaseUrl: 'https://your-app.example.com',
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run') {
      out.dryRun = true;
    } else if (arg.startsWith('--service=')) {
      out.service = arg.split('=')[1];
    } else if (arg.startsWith('--project=')) {
      out.project = arg.split('=')[1];
    } else if (arg.startsWith('--region=')) {
      out.region = arg.split('=')[1];
    } else if (arg.startsWith('--image-repo=')) {
      out.imageRepo = arg.split('=')[1];
    } else if (arg.startsWith('--app-base-url=')) {
      out.appBaseUrl = arg.split('=')[1];
    }
  }
  return out;
};

const run = (cmd, args, options = {}) => {
  const printable = `${cmd} ${args.join(' ')}`;
  const isWin = process.platform === 'win32';
  if (options.dryRun) {
    console.log(`[dry-run] ${printable}`);
    return '';
  }
  const quoteWin = (arg) =>
    /[\s"&|<>^]/.test(arg) ? `"${String(arg).replace(/"/g, '\\"')}"` : String(arg);
  const command = isWin ? `${cmd} ${args.map(quoteWin).join(' ')}` : cmd;
  const commandArgs = isWin ? [] : args;
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: isWin,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = result.stderr || '';
    throw new Error(`Command failed (${result.status}): ${printable}\n${stderr}`);
  }
  return (result.stdout || '').trim();
};

const getTag = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    '-',
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
  ].join('');
};

const readEnvKeyConfig = () => {
  const p = path.join(process.cwd(), 'scripts', 'config', 'env-keys.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
};

const envArrayToMaps = (envArray) => {
  const values = {};
  const secrets = {};
  const secretRefs = {};
  for (const item of envArray || []) {
    if (!item || !item.name) continue;
    if (typeof item.value === 'string') {
      values[item.name] = item.value;
    } else if (item.valueFrom?.secretKeyRef?.name) {
      const secretName = item.valueFrom.secretKeyRef.name;
      const secretKey = item.valueFrom.secretKeyRef.key || 'latest';
      secrets[item.name] = `${secretName}:${secretKey}`;
      secretRefs[item.name] = { secretName, secretKey };
    }
  }
  return { values, secrets, secretRefs };
};

const ensureKeys = (map, keys, label) => {
  const missing = keys.filter((k) => !(k in map) || String(map[k] || '').trim() === '');
  if (missing.length > 0) {
    throw new Error(`${label} missing required keys: ${missing.join(', ')}`);
  }
};

const toCommaPairs = (obj) =>
  Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(',');

const ensurePublicKeysBackedByEnvOrSecret = (values, secrets, keys, label) => {
  const missing = keys.filter((k) => {
    const value = String(values[k] || '').trim();
    return value === '' && !(k in secrets);
  });
  if (missing.length > 0) {
    throw new Error(`${label} missing required keys: ${missing.join(', ')}`);
  }
};

const decodeHtmlAttribute = (value) =>
  String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const readRuntimeEnvFromLoginHtml = (html) => {
  const legacyMatch = html.match(/window\.__PATHFINDER_PUBLIC_ENV__=([^;]+);/);
  if (legacyMatch?.[1]) {
    return JSON.parse(legacyMatch[1]);
  }

  const metaTagMatch = html.match(/<meta[^>]+id="pathfinder-public-env"[^>]*>/i);
  if (!metaTagMatch?.[0]) {
    return null;
  }
  const payloadMatch = metaTagMatch[0].match(/\sdata-public-env="([^"]*)"/i);
  if (!payloadMatch?.[1]) {
    return null;
  }
  const decoded = decodeHtmlAttribute(payloadMatch[1]);
  return JSON.parse(decoded);
};

const checkLoginRuntime = async (baseUrl, requiredRuntimeKeys) => {
  const loginUrl = `${baseUrl.replace(/\/+$/, '')}/login`;
  const res = await fetch(loginUrl);
  const html = await res.text();
  if (!res.ok) {
    throw new Error(`Login check failed: HTTP ${res.status}`);
  }
  if (html.includes('Firebase failed to initialize')) {
    throw new Error('Login still shows Firebase initialization error banner.');
  }
  const runtimeEnv = readRuntimeEnvFromLoginHtml(html);
  if (!runtimeEnv || typeof runtimeEnv !== 'object') {
    throw new Error('Runtime public env payload is missing on login page.');
  }
  const missingRuntime = requiredRuntimeKeys.filter(
    (key) => !runtimeEnv[key] || String(runtimeEnv[key]).trim() === '',
  );
  if (missingRuntime.length > 0) {
    throw new Error(`Runtime public env missing keys: ${missingRuntime.join(', ')}`);
  }
};

async function main() {
  const cli = parseArgs();
  const cfg = { ...DEFAULTS, ...cli };
  const image = `${cfg.imageRepo}:${getTag()}`;
  const envKeyCfg = readEnvKeyConfig();
  const requiredPublicBuildKeys = envKeyCfg.required.filter((k) => k.startsWith('NEXT_PUBLIC_'));
  const optionalPublicBuildKeys = (envKeyCfg.optional || []).filter((k) => k.startsWith('NEXT_PUBLIC_'));
  const requiredSecrets = ['FIREBASE_ADMIN_SDK_JSON', 'TURNSTILE_SECRET_KEY'];

  console.log(`Deploy target: ${cfg.service} (${cfg.project}/${cfg.region})`);
  const serviceJsonRaw = run(
    'gcloud',
    [
      'run',
      'services',
      'describe',
      cfg.service,
      '--region',
      cfg.region,
      '--project',
      cfg.project,
      '--format=json',
    ],
    { capture: true, dryRun: false },
  );

  const serviceJson = JSON.parse(serviceJsonRaw);
  const envArray = serviceJson?.spec?.template?.spec?.containers?.[0]?.env || [];
  const {
    values: runtimeValues,
    secrets: runtimeSecrets,
    secretRefs: runtimeSecretRefs,
  } = envArrayToMaps(envArray);

  const buildValues = { ...runtimeValues };

  const resolveBuildValue = (key) => {
    const existing = String(buildValues[key] || '').trim();
    if (existing) return existing;

    const ref = runtimeSecretRefs[key];
    if (!ref) return '';

    if (cfg.dryRun) {
      console.log(
        `[dry-run] resolve build value for ${key} from secret ${ref.secretName}:${ref.secretKey}`,
      );
      return '';
    }

    const secretValue = run(
      'gcloud',
      [
        'secrets',
        'versions',
        'access',
        ref.secretKey,
        '--secret',
        ref.secretName,
        '--project',
        cfg.project,
      ],
      { capture: true, dryRun: false },
    );
    const normalized = String(secretValue || '').trim();
    if (normalized) {
      buildValues[key] = normalized;
    }
    return normalized;
  };

  ensurePublicKeysBackedByEnvOrSecret(
    runtimeValues,
    runtimeSecrets,
    requiredPublicBuildKeys,
    'Cloud Run runtime public env',
  );
  ensureKeys(runtimeSecrets, requiredSecrets, 'Cloud Run secret bindings');

  [...requiredPublicBuildKeys, ...optionalPublicBuildKeys].forEach((key) => {
    resolveBuildValue(key);
  });
  ensureKeys(buildValues, requiredPublicBuildKeys, 'Build-time public env');

  const buildKeys = [
    ...new Set([
      ...requiredPublicBuildKeys,
      ...optionalPublicBuildKeys.filter((k) => String(buildValues[k] || '').trim() !== ''),
    ]),
  ];

  const substitutions = { _IMAGE: image };
  for (const key of buildKeys) substitutions[`_${key}`] = buildValues[key];
  const substitutionsArg = toCommaPairs(substitutions);
  const updateEnvArg = toCommaPairs(runtimeValues);
  const updateSecretsArg = toCommaPairs(runtimeSecrets);

  console.log(`Building image: ${image}`);
  run(
    'gcloud',
    [
      'builds',
      'submit',
      '.',
      '--config',
      'cloudbuild.yaml',
      '--project',
      cfg.project,
      '--substitutions',
      substitutionsArg,
    ],
    { capture: false, dryRun: cfg.dryRun },
  );

  console.log('Deploying image to Cloud Run...');
  run(
    'gcloud',
    [
      'run',
      'deploy',
      cfg.service,
      '--image',
      image,
      '--region',
      cfg.region,
      '--project',
      cfg.project,
      '--update-secrets',
      updateSecretsArg,
      '--update-env-vars',
      updateEnvArg,
      '--quiet',
    ],
    { capture: false, dryRun: cfg.dryRun },
  );

  if (cfg.dryRun) {
    console.log('Dry run complete.');
    return;
  }

  console.log('Running postdeploy endpoint checks...');
  run('npm', ['run', 'postdeploy:check'], { capture: false, dryRun: cfg.dryRun });

  console.log('Running runtime login env check...');
  await checkLoginRuntime(cfg.appBaseUrl, requiredPublicBuildKeys);
  console.log('Deploy succeeded: build args, runtime env/secrets, and login runtime check are all valid.');
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
