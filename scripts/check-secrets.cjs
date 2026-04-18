const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  'reports',
];
const SAFE_EXAMPLE_FILES = new Set(['.env.example', '.env.local.example']);
const FORBIDDEN_FILE_PATTERNS = [
  /(^|\/)key\.json$/i,
  /(^|\/)service-account\.json$/i,
  /(^|\/)firebase-adminsdk-[^/]+\.json$/i,
];

const CONTENT_RULES = [
  {
    id: 'private-key-block',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/m,
  },
  {
    id: 'gcp-service-account-json',
    regex: /"type"\s*:\s*"service_account"[\s\S]{0,2000}"private_key"\s*:\s*"/m,
  },
  {
    id: 'openai-api-key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/m,
  },
  {
    id: 'github-pat',
    regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/m,
  },
];

function getRepoFiles() {
  const output = execSync('git ls-files --cached --others --exclude-standard', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

function shouldSkip(file) {
  return EXCLUDED_DIRS.some((dir) => file.startsWith(`${dir}/`) || file.includes(`/${dir}/`));
}

function isLikelyBinary(buffer) {
  const scanLength = Math.min(buffer.length, 4096);
  for (let i = 0; i < scanLength; i += 1) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function findForbiddenFilename(file) {
  return FORBIDDEN_FILE_PATTERNS.find((pattern) => pattern.test(file));
}

function findSecretRule(text) {
  return CONTENT_RULES.find((rule) => rule.regex.test(text));
}

function main() {
  const offenders = [];
  const files = getRepoFiles();

  for (const file of files) {
    if (shouldSkip(file)) continue;
    if (SAFE_EXAMPLE_FILES.has(file)) continue;

    const forbiddenFilename = findForbiddenFilename(file);
    if (forbiddenFilename) {
      offenders.push({ file, reason: 'forbidden-credential-filename' });
      continue;
    }

    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    if (!fs.statSync(fullPath).isFile()) continue;

    const buffer = fs.readFileSync(fullPath);
    if (isLikelyBinary(buffer)) continue;

    const text = buffer.toString('utf8');
    const secretRule = findSecretRule(text);
    if (secretRule) {
      offenders.push({ file, reason: secretRule.id });
    }
  }

  if (offenders.length > 0) {
    console.error('Secret scan failed. Remove credentials/secrets from repository files:');
    for (const offender of offenders) {
      console.error(`- ${offender.file} (${offender.reason})`);
    }
    process.exit(1);
  }

  console.log('Secret scan passed.');
}

main();
