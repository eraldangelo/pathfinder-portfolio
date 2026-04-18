import { useCallback, useEffect, useState } from 'react';
import { db, ensureFirebaseReady } from '@/services/firebase';
import type { EducationProvider } from '../types/EducationProviderTypes';

const sortProvidersByName = (providers: EducationProvider[]) =>
    [...providers].sort((a, b) => a.name.localeCompare(b.name));

const normalizeProgramsValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value !== 'string') return [];
    return value
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);
};

const mapFirestoreProvider = (doc: any): EducationProvider | null => {
    const data = doc.data?.() || {};
    const name = String(data.name ?? '').trim();
    const country = String(data.country ?? '').trim();
    if (!name || !country) return null;

    return {
        id: String(doc.id ?? '').trim() || `${country}--${name}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
        name,
        country,
        domain: data.domain ? String(data.domain).trim() : null,
        logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null,
        website: data.website ? String(data.website).trim() : null,
        intakes: data.intakes ? String(data.intakes).trim() : null,
        generalPrograms: normalizeProgramsValue(data.generalPrograms),
        popularPrograms: normalizeProgramsValue(data.popularPrograms),
        isActive: data.isActive !== false,
    };
};

export const useEducationProviders = () => {
    const [providers, setProviders] = useState<EducationProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProviders = useCallback(async () => {
        setIsLoading(true);
        const firebaseReady = await ensureFirebaseReady();

        if (!firebaseReady || !db) {
            setProviders([]);
            setUsingFallback(true);
            setError('Firebase is not ready. Education provider data could not be loaded.');
            setIsLoading(false);
            return;
        }

        try {
            const snapshot = await db.collection('educationProviders').get();
            const firestoreProviders = snapshot.docs
                .map((doc: any) => mapFirestoreProvider(doc))
                .filter((provider: EducationProvider | null): provider is EducationProvider => Boolean(provider))
                .filter((provider) => provider.isActive !== false);

            if (firestoreProviders.length > 0) {
                setProviders(sortProvidersByName(firestoreProviders));
                setUsingFallback(false);
                setError(null);
                setIsLoading(false);
                return;
            }

            setProviders([]);
            setUsingFallback(true);
            setError("No documents found in 'educationProviders'.");
        } catch (loadError) {
            console.error('Failed to fetch education providers from Firestore:', loadError);
            setProviders([]);
            setUsingFallback(true);
            setError('Failed to load education providers from Firestore.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProviders();
    }, [loadProviders]);

    return {
        providers,
        isLoading,
        usingFallback,
        error,
        refreshProviders: loadProviders,
    };
};
