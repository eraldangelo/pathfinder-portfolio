const { spawnSync } = require('node:child_process');
const MIN_JAVA_MAJOR = 17;
const MAX_JAVA_MAJOR = 21;

const parseJavaMajorVersion = (output) => {
  const match = String(output || '').match(/version\s+"([^"]+)"/i);
  if (!match) return null;
  const raw = match[1].trim();
  if (!raw) return null;

  if (raw.startsWith('1.')) {
    const legacy = Number.parseInt(raw.split('.')[1], 10);
    return Number.isFinite(legacy) ? legacy : null;
  }

  const major = Number.parseInt(raw.split('.')[0], 10);
  return Number.isFinite(major) ? major : null;
};

const printFailure = (details) => {
  console.error('Java runtime preflight failed for semantic Firebase rules tests.');
  if (details) {
    console.error(`Details: ${details}`);
  }
  console.error('Required action:');
  console.error(`- Install Java ${MIN_JAVA_MAJOR}-${MAX_JAVA_MAJOR} (Temurin/OpenJDK) and ensure \`java\` is on PATH.`);
  console.error('- Recommended baseline: Eclipse Temurin JDK 21 LTS (matches CI semantic-rules runner).');
  console.error('- Verify with: java -version');
  console.error('- Then rerun: npm run test:rules');
  console.error('Reference: docs/README.md (Validation Commands) and docs/RELEASE_RUNBOOK.md (Preconditions).');
};

const result = spawnSync('java', ['-version'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.error) {
  printFailure(result.error.message || 'java executable not found.');
  process.exit(1);
}

if (result.status !== 0) {
  printFailure((result.stderr || result.stdout || '').trim() || `java exited with status ${result.status}`);
  process.exit(1);
}

const output = String(result.stderr || result.stdout || '').trim();
const firstLine = output.split(/\r?\n/).find(Boolean) || 'Java runtime detected.';
const majorVersion = parseJavaMajorVersion(output);

if (!majorVersion) {
  printFailure(`Unable to parse Java version from: ${firstLine}`);
  process.exit(1);
}

if (majorVersion < MIN_JAVA_MAJOR) {
  printFailure(`Detected Java major version ${majorVersion}. Java ${MIN_JAVA_MAJOR}-${MAX_JAVA_MAJOR} is required.`);
  process.exit(1);
}

if (majorVersion > MAX_JAVA_MAJOR) {
  printFailure(
    `Detected Java major version ${majorVersion}. Firebase Storage emulator compatibility is validated on Java ${MIN_JAVA_MAJOR}-${MAX_JAVA_MAJOR}.`,
  );
  process.exit(1);
}

console.log(`Java runtime preflight passed: ${firstLine} (major=${majorVersion})`);
