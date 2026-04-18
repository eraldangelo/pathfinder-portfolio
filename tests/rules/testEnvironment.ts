import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

const FIRESTORE_RULES = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');
const STORAGE_RULES = readFileSync(join(process.cwd(), 'storage.rules'), 'utf8');
const DEFAULT_PROJECT_ID = 'demo-pathfinder-rules';

const parseHost = (raw: string | undefined, fallbackHost: string, fallbackPort: number) => {
  const normalized = String(raw || '').trim();
  if (!normalized) return { host: fallbackHost, port: fallbackPort };
  const [host, portValue] = normalized.split(':');
  const port = Number(portValue);
  return {
    host: host || fallbackHost,
    port: Number.isInteger(port) && port > 0 ? port : fallbackPort,
  };
};

export const getRulesProjectId = () => process.env.RULES_TEST_PROJECT_ID || DEFAULT_PROJECT_ID;

export const getRulesBucket = () => `${getRulesProjectId()}.appspot.com`;

export const createRulesTestEnvironment = async (): Promise<RulesTestEnvironment> => {
  const firestore = parseHost(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1', 8080);
  const storage = parseHost(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1', 9199);

  return initializeTestEnvironment({
    projectId: getRulesProjectId(),
    firestore: {
      host: firestore.host,
      port: firestore.port,
      rules: FIRESTORE_RULES,
    },
    storage: {
      host: storage.host,
      port: storage.port,
      rules: STORAGE_RULES,
    },
  });
};
