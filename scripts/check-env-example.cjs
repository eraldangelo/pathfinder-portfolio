const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'scripts', 'config', 'env-keys.json');
const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example');

const parseEnvKeys = (content) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.split('=')[0].trim());

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const required = new Set(config.required || []);
  const optional = new Set(config.optional || []);
  const known = new Set([...required, ...optional]);

  const envText = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  const envKeys = parseEnvKeys(envText);
  const envSet = new Set(envKeys);

  const missingRequired = [...required].filter((key) => !envSet.has(key));
  const unknownKeys = [...envSet].filter((key) => !known.has(key));

  if (missingRequired.length > 0 || unknownKeys.length > 0) {
    console.error('Env example drift detected:');
    if (missingRequired.length > 0) {
      console.error('Missing required keys in .env.example:');
      missingRequired.forEach((key) => console.error(`- ${key}`));
    }
    if (unknownKeys.length > 0) {
      console.error('Unknown keys found in .env.example (not in scripts/config/env-keys.json):');
      unknownKeys.forEach((key) => console.error(`- ${key}`));
    }
    process.exit(1);
  }

  console.log(
    `Env example check passed (${required.size} required + ${optional.size} optional known keys).`,
  );
}

main();

