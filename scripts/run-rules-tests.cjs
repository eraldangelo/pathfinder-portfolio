const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const RULES_TESTS_DIR = path.join(ROOT, 'tests', 'rules');

const collectRuleTests = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRuleTests(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
};

if (!fs.existsSync(RULES_TESTS_DIR)) {
  console.error('Rules tests directory not found:', RULES_TESTS_DIR);
  process.exit(1);
}

const testFiles = collectRuleTests(RULES_TESTS_DIR).sort();
if (testFiles.length === 0) {
  console.error('No rules test files were found under tests/rules.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
