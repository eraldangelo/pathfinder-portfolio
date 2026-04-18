const admin = require('firebase-admin');
const fs = require('node:fs');
const path = require('node:path');

const parseEnvFile = (rawText) => {
  const env = {};
  for (const rawLine of rawText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const line = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 1) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
};

const ensureFirebaseAdminSdkEnv = () => {
  if (process.env.FIREBASE_ADMIN_SDK_JSON) return;
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const env = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
  if (env.FIREBASE_ADMIN_SDK_JSON) {
    process.env.FIREBASE_ADMIN_SDK_JSON = env.FIREBASE_ADMIN_SDK_JSON;
  }
};

const loadServiceAccount = (rawValue) => {
  const trimmed = String(rawValue ?? '').trim();
  if (!trimmed) return null;
  const source = trimmed.startsWith('{')
    ? trimmed
    : fs.readFileSync(path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed), 'utf8');
  const parsed = JSON.parse(source);
  if (parsed && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
};

const getFirestore = () => {
  if (admin.apps.length > 0) return admin.firestore();

  ensureFirebaseAdminSdkEnv();
  const rawServiceAccount = process.env.FIREBASE_ADMIN_SDK_JSON;
  if (rawServiceAccount) {
    const serviceAccount = loadServiceAccount(rawServiceAccount);
    if (!serviceAccount?.project_id || !serviceAccount?.client_email || !serviceAccount?.private_key) {
      throw new Error('FIREBASE_ADMIN_SDK_JSON is missing required fields.');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });
    return admin.firestore();
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return admin.firestore();
  }

  throw new Error(
    'Missing Firebase credentials. Set FIREBASE_ADMIN_SDK_JSON (or path in .env.local) or GOOGLE_APPLICATION_CREDENTIALS.',
  );
};

module.exports = {
  admin,
  getFirestore,
};
