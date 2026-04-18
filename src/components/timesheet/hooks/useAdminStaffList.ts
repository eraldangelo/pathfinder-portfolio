import { useEffect, useState } from 'react';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import type { StaffProfile } from '../types/leaveRequestTypes';

export const useAdminStaffList = (enabled: boolean) => {
    const [staffList, setStaffList] = useState<StaffProfile[]>([]);

    useEffect(() => {
        let cancelled = false;
        if (!enabled) {
            setStaffList([]);
            return () => {
                cancelled = true;
            };
        }

        const loadStaffList = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled || !ready || !db) return;
            try {
                const snapshot = await db.collection('personnel').orderBy('name').get();
                if (cancelled) return;
                const entries = snapshot.docs
                    .map((doc) => {
                        const data = doc.data() || {};
                        return {
                            uid: doc.id,
                            name: String(data.name ?? doc.id),
                            branch: data.branch ?? null,
                            email: data.email ?? null,
                            leaveBalance:
                                typeof data.leaveBalance === 'number'
                                    ? data.leaveBalance
                                    : null,
                        };
                    })
                    .filter((profile) => (profile.email ?? '').toLowerCase() !== 'chul@example.com');
                setStaffList(entries);
            } catch (err) {
                console.error('Error loading staff list for leave requests filter:', err);
            }
        };

        void loadStaffList();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return staffList;
};
