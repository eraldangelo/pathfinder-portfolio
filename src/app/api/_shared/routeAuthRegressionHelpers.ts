import assert from 'node:assert/strict';
import { __setFirebaseAdminOverridesForTests } from '@/lib/firebaseAdmin';
import { __setRateLimitBypassForTests } from './rateLimit';

export const buildJsonPostRequest = (path: string, token: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

export const buildAuthedGetRequest = (path: string, token: string) =>
  new Request(`http://localhost${path}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });

export const withEnv = async (
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
) => {
  const env = process.env as Record<string, string | undefined>;
  const previous: Record<string, string | undefined> = {};
  Object.entries(values).forEach(([key, value]) => {
    previous[key] = env[key];
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  });

  try {
    await callback();
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    });
  }
};

export const createMockAdminAuth = (mode: 'valid' | 'invalid' | 'internal') => ({
  verifyIdToken: async () => {
    if (mode === 'invalid') {
      throw { code: 'auth/invalid-id-token', message: 'Invalid token.' };
    }
    if (mode === 'internal') {
      throw { code: 'auth/internal-error', message: 'Auth backend unavailable.' };
    }
    return {
      uid: 'requester-1',
      admin: false,
      email: 'requester@example.com',
      name: 'Requester',
    };
  },
  createCustomToken: async () => 'mock-custom-token',
  createUser: async () => ({ uid: 'created-user-1' }),
  deleteUser: async () => {},
  updateUser: async () => {},
});

export const createMockAdminDb = (requesterRole: string) => {
  const requesterDocData = {
    role: requesterRole,
    name: 'Requester Name',
    branch: 'Manila',
    passwordNeedsReset: true,
  };

  const createDocRef = (collectionName: string, id: string) => ({
    id,
    path: `${collectionName}/${id}`,
    async get() {
      if (collectionName === 'personnel') {
        return { exists: true, id, data: () => requesterDocData };
      }
      if (collectionName === 'archives') {
        return { exists: false, id, data: () => ({}) };
      }
      return { exists: false, id, data: () => ({}) };
    },
    async set() {},
    async delete() {},
    collection: () => ({
      doc: (childId: string) => createDocRef(`${collectionName}/${id}`, childId),
    }),
  });

  return {
    collection: (name: string) => ({
      doc: (id: string) => createDocRef(name, id),
      async get() {
        return { docs: [] };
      },
      select: () => ({
        async get() {
          return { docs: [] };
        },
      }),
    }),
    collectionGroup: () => ({
      where: () => ({
        async get() {
          return { docs: [] };
        },
      }),
      select: () => ({
        async get() {
          return { docs: [] };
        },
      }),
      async get() {
        return { docs: [] };
      },
    }),
    async getAll(...refs: Array<{ id: string }>) {
      return refs.map((ref) => ({ exists: true, id: ref.id, data: () => ({}) }));
    },
    batch: () => ({
      set() {},
      async commit() {},
    }),
    async runTransaction<T>(handler: (tx: { get: (ref: any) => Promise<any>; set: (ref: any, data: any, options?: any) => void; }) => Promise<T>) {
      const tx = {
        async get(ref: any) {
          return ref.get();
        },
        set() {},
      };
      return handler(tx);
    },
  };
};

export const assertExplicitInternalJsonShape = async (response: Response) => {
  assert.equal(response.status, 500);
  assert.match(String(response.headers.get('content-type') || ''), /application\/json/);
  const payload = await response.json();
  const hasError = typeof payload?.error === 'string' && payload.error.length > 0;
  const hasMessage = typeof payload?.message === 'string' && payload.message.length > 0;
  assert.equal(hasError || hasMessage, true);
};

export const withMockedAuthDeps = async (
  mode: 'valid' | 'invalid' | 'internal',
  requesterRole: string,
  callback: () => Promise<void>,
) => {
  __setRateLimitBypassForTests(true);
  __setFirebaseAdminOverridesForTests({
    getAdminAuth: () => createMockAdminAuth(mode) as any,
    getAdminDb: () => createMockAdminDb(requesterRole) as any,
  });
  try {
    await callback();
  } finally {
    __setFirebaseAdminOverridesForTests(null);
    __setRateLimitBypassForTests(false);
  }
};
