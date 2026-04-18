#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULTS = {
  project: 'your-gcp-project',
  service: 'pathfinder',
  region: 'asia-southeast1',
  baseUrl: 'https://your-app.example.com/',
  notificationChannels: [],
};

const UPTIME_DISPLAY_NAME = '[Pathfinder] prod uptime';
const POLICY_DISPLAY_NAMES = {
  errors: '[Pathfinder] Cloud Run 5xx Error Rate',
  latency: '[Pathfinder] Cloud Run P95 Latency',
  uptime: '[Pathfinder] Production Uptime Failure',
};

const parseArgs = () => {
  const out = { ...DEFAULTS };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--project=')) out.project = arg.split('=')[1];
    if (arg.startsWith('--service=')) out.service = arg.split('=')[1];
    if (arg.startsWith('--region=')) out.region = arg.split('=')[1];
    if (arg.startsWith('--base-url=')) out.baseUrl = arg.split('=')[1];
    if (arg.startsWith('--notification-channels=')) {
      out.notificationChannels = arg
        .split('=')[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
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

const ensureUptimeCheck = (cfg) => {
  const uptimeConfigs = runJson('gcloud', ['monitoring', 'uptime', 'list-configs', '--project', cfg.project]) || [];
  const existing = uptimeConfigs.find((item) => item.displayName === UPTIME_DISPLAY_NAME);
  if (existing) return existing;

  const host = new URL(cfg.baseUrl).host;
  runCapture('gcloud', [
    'monitoring',
    'uptime',
    'create',
    UPTIME_DISPLAY_NAME,
    '--project',
    cfg.project,
    '--resource-type=uptime-url',
    `--resource-labels=host=${host},project_id=${cfg.project}`,
    '--protocol=https',
    '--path=/login',
    '--period=5',
    '--timeout=10',
    '--status-classes=2xx,3xx',
    '--validate-ssl=true',
    '--regions=asia-pacific,usa-iowa,europe',
    '--user-labels=service=pathfinder,env=prod',
  ]);

  const refreshed = runJson('gcloud', ['monitoring', 'uptime', 'list-configs', '--project', cfg.project]) || [];
  const created = refreshed.find((item) => item.displayName === UPTIME_DISPLAY_NAME);
  if (!created) throw new Error('Unable to find created uptime check.');
  return created;
};

const writePolicyFile = (policy) => {
  const filePath = path.join(os.tmpdir(), `pathfinder-policy-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(policy, null, 2));
  return filePath;
};

const buildPolicies = (cfg, uptimeCheckId) => {
  const runResource = `resource.type="cloud_run_revision" AND resource.labels.service_name="${cfg.service}" AND resource.labels.location="${cfg.region}"`;
  const documentation = {
    mimeType: 'text/markdown',
    content:
      'Pathfinder runbook: `docs/INCIDENT_RUNBOOK.md` and `docs/RELEASE_RUNBOOK.md`.\nInvestigate recent deploys, then run `npm run postdeploy:check`.',
  };

  return [
    {
      displayName: POLICY_DISPLAY_NAMES.errors,
      combiner: 'OR',
      enabled: true,
      userLabels: { service: 'pathfinder', env: 'prod', category: 'availability' },
      documentation,
      notificationChannels: cfg.notificationChannels,
      conditions: [
        {
          displayName: 'Cloud Run 5xx request ratio > 2% (5m)',
          conditionThreshold: {
            filter: `${runResource} AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"`,
            denominatorFilter: `${runResource} AND metric.type="run.googleapis.com/request_count"`,
            aggregations: [{ alignmentPeriod: '300s', perSeriesAligner: 'ALIGN_RATE' }],
            denominatorAggregations: [{ alignmentPeriod: '300s', perSeriesAligner: 'ALIGN_RATE' }],
            comparison: 'COMPARISON_GT',
            thresholdValue: 0.02,
            duration: '300s',
            trigger: { count: 1 },
          },
        },
      ],
    },
    {
      displayName: POLICY_DISPLAY_NAMES.latency,
      combiner: 'OR',
      enabled: true,
      userLabels: { service: 'pathfinder', env: 'prod', category: 'latency' },
      documentation,
      notificationChannels: cfg.notificationChannels,
      conditions: [
        {
          displayName: 'Cloud Run p95 request latency > 2s (5m)',
          conditionThreshold: {
            filter: `${runResource} AND metric.type="run.googleapis.com/request_latencies"`,
            aggregations: [
              {
                alignmentPeriod: '300s',
                perSeriesAligner: 'ALIGN_PERCENTILE_95',
                crossSeriesReducer: 'REDUCE_MEAN',
                groupByFields: ['resource.labels.service_name'],
              },
            ],
            comparison: 'COMPARISON_GT',
            thresholdValue: 2,
            duration: '300s',
            trigger: { count: 1 },
          },
        },
      ],
    },
    {
      displayName: POLICY_DISPLAY_NAMES.uptime,
      combiner: 'OR',
      enabled: true,
      userLabels: { service: 'pathfinder', env: 'prod', category: 'uptime' },
      documentation,
      notificationChannels: cfg.notificationChannels,
      conditions: [
        {
          displayName: 'Uptime check failed for 3m',
          conditionThreshold: {
            filter: `resource.type="uptime_url" AND metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND metric.labels.check_id="${uptimeCheckId}"`,
            aggregations: [{ alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_NEXT_OLDER' }],
            comparison: 'COMPARISON_LT',
            thresholdValue: 1,
            duration: '180s',
            trigger: { count: 1 },
          },
        },
      ],
    },
  ];
};

const upsertPolicies = (cfg, policies) => {
  const existingPolicies = runJson('gcloud', ['monitoring', 'policies', 'list', '--project', cfg.project]) || [];
  const byDisplayName = new Map(existingPolicies.map((item) => [item.displayName, item]));

  for (const policy of policies) {
    const existing = byDisplayName.get(policy.displayName);
    const policyFile = writePolicyFile(existing ? { ...policy, name: existing.name } : policy);
    try {
      if (existing) {
        runCapture('gcloud', [
          'monitoring',
          'policies',
          'update',
          existing.name,
          '--project',
          cfg.project,
          `--policy-from-file=${policyFile}`,
        ]);
        console.log(`Updated alert policy: ${policy.displayName}`);
      } else {
        runCapture('gcloud', [
          'monitoring',
          'policies',
          'create',
          '--project',
          cfg.project,
          `--policy-from-file=${policyFile}`,
        ]);
        console.log(`Created alert policy: ${policy.displayName}`);
      }
    } finally {
      fs.rmSync(policyFile, { force: true });
    }
  }
};

function main() {
  const cfg = parseArgs();
  const uptime = ensureUptimeCheck(cfg);
  const checkId = String(uptime.name || '').split('/').pop();
  if (!checkId) throw new Error('Unable to resolve uptime check ID.');

  const policies = buildPolicies(cfg, checkId);
  upsertPolicies(cfg, policies);
  console.log(`Alerting baseline ensured for ${cfg.service} (${cfg.project}/${cfg.region}).`);
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
