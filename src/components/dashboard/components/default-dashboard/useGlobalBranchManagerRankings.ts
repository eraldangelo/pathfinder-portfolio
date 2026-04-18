import { useEffect, useState } from 'react';
import { auth, ensureFirebaseReady } from '../../../../services/firebase';
import type { TopCounsellorRanking, TopStaffReferrerRanking } from './types';

interface UseGlobalBranchManagerRankingsParams {
    enabled: boolean;
    authUid?: string | null;
}

export const useGlobalBranchManagerRankings = ({ enabled, authUid }: UseGlobalBranchManagerRankingsParams) => {
    const [globalTopCounsellors, setGlobalTopCounsellors] = useState<TopCounsellorRanking[] | null>(null);
    const [globalTopStaffReferrers, setGlobalTopStaffReferrers] = useState<TopStaffReferrerRanking[] | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadGlobalBranchManagerRankings = async () => {
            if (!enabled) {
                setGlobalTopCounsellors(null);
                setGlobalTopStaffReferrers(null);
                return;
            }

            try {
                const firebaseReady = await ensureFirebaseReady();
                if (!firebaseReady || !auth?.currentUser) return;

                const token = await auth.currentUser.getIdToken();
                const [topCounsellorsResponse, topReferrersResponse] = await Promise.all([
                    fetch('/api/dashboard/top-visa-grant-counsellors', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch('/api/dashboard/top-staff-referrers', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                if (cancelled) return;

                if (topCounsellorsResponse.ok) {
                    const counsellorsPayload = (await topCounsellorsResponse.json()) as {
                        ok?: boolean;
                        data?: TopCounsellorRanking[];
                    };
                    if (Array.isArray(counsellorsPayload?.data)) {
                        setGlobalTopCounsellors(counsellorsPayload.data);
                    }
                }

                if (topReferrersResponse.ok) {
                    const referrersPayload = (await topReferrersResponse.json()) as {
                        ok?: boolean;
                        data?: TopStaffReferrerRanking[];
                    };
                    if (Array.isArray(referrersPayload?.data)) {
                        setGlobalTopStaffReferrers(referrersPayload.data);
                    }
                }
            } catch (error) {
                console.error('Failed to load branch manager global rankings:', error);
            }
        };

        void loadGlobalBranchManagerRankings();
        return () => {
            cancelled = true;
        };
    }, [authUid, enabled]);

    return {
        globalTopCounsellors,
        globalTopStaffReferrers,
    };
};
