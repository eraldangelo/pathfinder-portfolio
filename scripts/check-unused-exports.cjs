const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const REPORT_DIR = join(process.cwd(), 'reports');
const REPORT_FILE = join(REPORT_DIR, 'ts-prune-report.txt');
const IGNORE_PATTERN = '^\\\\.?[\\\\/]?.next[\\\\/]';
const STRICT = process.env.STRICT_UNUSED_EXPORTS === 'true';
const UNUSED_EXPORTS_MAX = Number(process.env.UNUSED_EXPORTS_MAX || '71');
const ROUTE_EXPORTS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const ROUTE_RUNTIME_EXPORTS = new Set(['runtime', 'dynamic', 'revalidate', 'preferredRegion']);

function runTsPrune() {
  const args = ['ts-prune', '-p', 'tsconfig.json', '-i', IGNORE_PATTERN];
  return spawnSync('npx', args, { encoding: 'utf8', shell: true });
}

function getLines(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseEntry(line) {
  const match = line.match(/^(.+?):\d+\s+-\s+(.+)$/);
  if (!match) return null;
  return {
    file: match[1].trim().replace(/\\/g, '/').replace(/^\.?\//, ''),
    name: match[2].trim(),
  };
}

function isNoiseEntry(line) {
  if (line.includes('(used in module)')) return true;
  const entry = parseEntry(line);
  if (!entry) return false;

  const file = entry.file;
  const name = entry.name;

  if (file.startsWith('.next/')) return true;
  if (file === 'next-env.d.ts') return true;
  if (/^(next|playwright)\.config\.ts$/.test(file) && name === 'default') return true;

  if (file.startsWith('src/app/')) {
    if (/\/(page|layout|loading|error|not-found|template)\.tsx?$/.test(file) && name === 'default') return true;
    if (/\/layout\.tsx?$/.test(file) && name === 'metadata') return true;
    if (/\/route\.ts$/.test(file) && (ROUTE_EXPORTS.has(name) || ROUTE_RUNTIME_EXPORTS.has(name))) return true;
  }

  return false;
}

function splitEntries(lines) {
  const actionable = [];
  const ignored = [];
  for (const line of lines) {
    if (isNoiseEntry(line)) {
      ignored.push(line);
    } else {
      actionable.push(line);
    }
  }
  return { actionable, ignored };
}

function writeReport(rawLines, actionableLines, ignoredLines, stderr) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const header = [
    `Generated: ${new Date().toISOString()}`,
    `Strict mode: ${STRICT ? 'on' : 'off'}`,
    `Actionable budget: ${Number.isFinite(UNUSED_EXPORTS_MAX) ? UNUSED_EXPORTS_MAX : 'invalid'}`,
    `Raw ts-prune entries: ${rawLines.length}`,
    `Actionable entries: ${actionableLines.length}`,
    `Filtered noise entries: ${ignoredLines.length}`,
    '',
    '--- Actionable ---',
  ].join('\n');
  const body = actionableLines.length > 0 ? actionableLines.join('\n') : 'No actionable unused exports detected.';
  const ignored = ignoredLines.length > 0 ? `\n\n--- Filtered noise ---\n${ignoredLines.join('\n')}` : '';
  const trailer = stderr ? `\n\nstderr:\n${stderr.trim()}\n` : '\n';
  writeFileSync(REPORT_FILE, `${header}${body}${ignored}${trailer}`, 'utf8');
}

function main() {
  if (!Number.isFinite(UNUSED_EXPORTS_MAX) || UNUSED_EXPORTS_MAX < 0) {
    console.error(`Invalid UNUSED_EXPORTS_MAX value: ${process.env.UNUSED_EXPORTS_MAX || '(empty)'}`);
    process.exit(1);
  }

  const result = runTsPrune();
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const rawLines = getLines(stdout);
  const { actionable, ignored } = splitEntries(rawLines);
  writeReport(rawLines, actionable, ignored, stderr);

  console.log(`ts-prune entries: raw=${rawLines.length}, actionable=${actionable.length}, filtered=${ignored.length}`);
  console.log(`report: ${REPORT_FILE}`);

  if (result.status !== 0 && !STRICT) {
    console.warn('ts-prune exited non-zero in advisory mode; continuing.');
    process.exit(0);
  }
  if (STRICT && actionable.length > 0) {
    console.error('Unused exports detected in strict mode.');
    process.exit(1);
  }
  if (!STRICT && actionable.length > UNUSED_EXPORTS_MAX) {
    console.error(
      `Unused exports budget exceeded: actionable=${actionable.length}, max=${UNUSED_EXPORTS_MAX}.`,
    );
    process.exit(1);
  }
  process.exit(result.status || 0);
}

main();
