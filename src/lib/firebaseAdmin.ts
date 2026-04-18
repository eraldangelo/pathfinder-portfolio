import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

type ServiceAccount = {
    project_id?: string;
    client_email?: string;
    private_key?: string;
};

type FirebaseAdminTestOverrides = {
    getAdminAuth?: () => ReturnType<admin.app.App['auth']>;
    getAdminDb?: () => ReturnType<admin.app.App['firestore']>;
};

let firebaseAdminTestOverrides: FirebaseAdminTestOverrides | null = null;

const getServiceAccount = (): ServiceAccount | null => {
    const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!raw) return null;

    const trimmed = raw.trim();

    try {
        const json =
            trimmed.startsWith('{')
                ? trimmed
                : fs.readFileSync(path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed), 'utf8');

        const parsed = JSON.parse(json) as ServiceAccount;
        if (parsed?.private_key) {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
    } catch (err) {
        console.error('Failed to load FIREBASE_ADMIN_SDK_JSON:', err);
        return null;
    }
};

export const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
        throw new Error('Missing FIREBASE_ADMIN_SDK_JSON');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    return admin.app();
};

export const getAdminAuth = () => {
    const override = firebaseAdminTestOverrides?.getAdminAuth;
    if (override) return override();
    return getAdminApp().auth();
};

export const getAdminDb = () => {
    const override = firebaseAdminTestOverrides?.getAdminDb;
    if (override) return override();
    return getAdminApp().firestore();
};

export const __setFirebaseAdminOverridesForTests = (overrides: FirebaseAdminTestOverrides | null) => {
    firebaseAdminTestOverrides = overrides;
};
