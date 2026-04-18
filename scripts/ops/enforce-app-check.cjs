#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const DEFAULTS = {
  project: 'your-gcp-project',
  mode: 'ENFORCED',
  apply: false,
  services: [
    'firestore.googleapis.com',
    'firebasestorage.googleapis.com',
    'identitytoolkit.googleapis.com',
  ],
};

const parseArgs = () => {
  const out = { ...DEFAULTS };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') out.apply = true;
    if (arg.startsWith('--project=')) out.project = arg.split('=')[1];
    if (arg.startsWith('--project-number=')) out.projectNumber = arg.split('=')[1];
    if (arg.startsWith('--mode=')) out.mode = String(arg.split('=')[1] || '').toUpperCase();
    if (arg.startsWith('--services=')) {
      out.services = arg
        .split('=')[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  if (out.mode !== 'ENFORCED' && out.mode !== 'UNENFORCED') {
    throw new Error(`Invalid --mode value "${out.mode}". Use ENFORCED or UNENFORCED.`);
  }
  if (out.services.length === 0) {
    throw new Error('At least one service must be provided via --services=');
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

const getAccessToken = () => runCapture('gcloud', ['auth', 'print-access-token']);

const getProjectNumber = (project) =>
  runCapture('gcloud', ['projects', 'describe', project, '--format=value(projectNumber)']);

const apiRequest = async ({ project, projectNumber, token, service, mode }) => {
  const base = `https://firebaseappcheck.googleapis.com/v1beta/projects/${projectNumber}/services/${service}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-user-project': project,
  };

  const currentRes = await fetch(base, { headers });
  const currentJson = await currentRes.json();
  if (!currentRes.ok) {
    const reason = currentJson?.error?.message || JSON.stringify(currentJson);
    throw new Error(`App Check read failed for ${service}: ${reason}`);
  }

  if (!mode) {
    return { service, current: currentJson.enforcementMode || 'UNENFORCED' };
  }

  const patchRes = await fetch(`${base}?updateMask=enforcementMode`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enforcementMode: mode }),
  });
  const patchJson = await patchRes.json();
  if (!patchRes.ok) {
    const reason = patchJson?.error?.message || JSON.stringify(patchJson);
    throw new Error(`App Check update failed for ${service}: ${reason}`);
  }
  return { service, current: currentJson.enforcementMode || 'UNENFORCED', updated: patchJson.enforcementMode };
};

async function main() {
  const cfg = parseArgs();
  const token = getAccessToken();
  const projectNumber = cfg.projectNumber || getProjectNumber(cfg.project);

  console.log(`Project: ${cfg.project} (${projectNumber})`);
  console.log(`Target mode: ${cfg.mode}`);
  console.log(`Services: ${cfg.services.join(', ')}`);
  if (!cfg.apply) {
    console.log('Dry-run mode. Add --apply to enforce settings.');
  }

  let drift = 0;
  for (const service of cfg.services) {
    const result = await apiRequest({
      project: cfg.project,
      projectNumber,
      token,
      service,
      mode: cfg.apply ? cfg.mode : null,
    });

    const effectiveMode = result.updated || result.current;
    const ok = effectiveMode === cfg.mode;
    const prefix = ok ? 'PASS' : 'FAIL';
    const updateInfo = result.updated ? ` -> ${result.updated}` : '';
    console.log(`${prefix} - ${service}: ${result.current}${updateInfo}`);
    if (!ok) drift += 1;
  }

  if (drift > 0) {
    console.error(`App Check enforcement drift detected (${drift}).`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
