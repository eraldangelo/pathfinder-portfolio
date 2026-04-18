const fs = require('fs');
const path = require('path');

const FIREBASE_CONFIG_PATH = path.join(process.cwd(), 'firebase.json');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const expectExactValue = (value, expected, label) => {
  if (value !== expected) {
    fail(`Firebase config drift: expected ${label} to be "${expected}", got "${value ?? 'undefined'}".`);
  }
};

function main() {
  if (!fs.existsSync(FIREBASE_CONFIG_PATH)) {
    fail('firebase.json not found.');
  }

  const raw = fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`firebase.json is not valid JSON: ${String(error)}`);
  }

  expectExactValue(parsed?.firestore?.rules, 'firestore.rules', 'firestore.rules');
  expectExactValue(parsed?.firestore?.indexes, 'firestore.indexes.json', 'firestore.indexes');
  expectExactValue(parsed?.storage?.rules, 'storage.rules', 'storage.rules');

  console.log('Firebase config check passed (firestore + storage rules bindings are explicit).');
}

main();
