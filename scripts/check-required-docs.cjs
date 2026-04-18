const fs = require('fs');
const path = require('path');

const REQUIRED_DOCS = [
  'docs/README.md',
  'docs/BLUEPRINT.md',
  'docs/SMOKE_TEST.md',
  'docs/RELEASE_RUNBOOK.md',
  'docs/INCIDENT_RUNBOOK.md',
  'docs/SECURITY.md',
  'docs/SUPPORT.md',
  'docs/OPERATIONS_HANDOVER.md',
  'docs/LOGIC_CONTRACT.md',
  'docs/GITHUB_BRANCH_PROTECTION.md',
];

function main() {
  const missing = REQUIRED_DOCS.filter((relativePath) =>
    !fs.existsSync(path.join(process.cwd(), relativePath)),
  );

  if (missing.length > 0) {
    console.error('Missing required docs/runbooks:');
    missing.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log(`Required docs check passed (${REQUIRED_DOCS.length} files).`);
}

main();

