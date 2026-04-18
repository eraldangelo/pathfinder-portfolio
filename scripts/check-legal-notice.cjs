const fs = require('fs');
const path = require('path');

const LEGAL_NOTICE_PATH = path.join(process.cwd(), 'src', 'config', 'legalNotice.ts');
const REQUIRED_SNIPPETS = [
  "productName: 'Pathfinder\\u00A9'",
  "creatorLine: 'Created by Pathfinder Team'",
  "rightsLine: 'All Rights Reserved 2026'",
];

function main() {
  if (!fs.existsSync(LEGAL_NOTICE_PATH)) {
    console.error('Legal notice file is missing: src/config/legalNotice.ts');
    process.exit(1);
  }

  const content = fs.readFileSync(LEGAL_NOTICE_PATH, 'utf8');
  const missingSnippets = REQUIRED_SNIPPETS.filter((snippet) => !content.includes(snippet));

  if (missingSnippets.length > 0) {
    console.error('Legal notice integrity check failed. Missing required values:');
    missingSnippets.forEach((snippet) => console.error(`- ${snippet}`));
    process.exit(1);
  }

  console.log('Legal notice integrity check passed.');
}

main();
