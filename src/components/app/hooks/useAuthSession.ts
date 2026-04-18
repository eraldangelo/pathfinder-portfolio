import { useEffect, useRef, useState } from 'react';
import { auth, db, type FirebaseUser } from '../../../services/firebase';
import { isDeveloperRole } from '../../../utils/roles';
import { resolveLeaveState } from '../../../utils/leave';
import { resolveOffsetState } from '../../../utils/offset';
import type { Personnel } from '../../../data/personnel';
import type { User } from '../../../types';
import { buildPersonnelUser } from './authSession/personnelMapper';

interface UseAuthSessionParams {
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useAuthSession = ({ t }: UseAuthSessionParams) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isForceResetRequired, setForceResetRequired] = useState(false);
    const balanceSyncInFlightRef = useRef(false);

    useEffect(() => {
        let personnelUnsubscribe: (() => void) | null = null;

        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
            setIsLoading(true);
            setError(null);
            setForceResetRequired(false);

            if (!firebaseUser) {
                if (personnelUnsubscribe) {
                    personnelUnsubscribe();
                    personnelUnsubscribe = null;
                }
                setUser(null);
                setUserRole(null);
                setIsLoading(false);
                return;
            }

            try {
                if (personnelUnsubscribe) {
                    personnelUnsubscribe();
                    personnelUnsubscribe = null;
                }

                personnelUnsubscribe = db.collection('personnel').doc(firebaseUser.uid).onSnapshot(
                    (personnelDoc: any) => {
                        if (!personnelDoc.exists) {
                            setError(
                                t(
                                    'fetchUserDataFailed',
                                    'Failed to fetch user data. Your account may be misconfigured. Please contact support.'
                                )
                            );
                            setForceResetRequired(false);
                            setUser(null);
                            setUserRole(null);
                            setIsLoading(false);
                            auth.signOut();
                            return;
                        }

                        const personnelData = personnelDoc.data() as Personnel;
                        const leaveState = resolveLeaveState({
                            balance: personnelData.leaveBalance,
                            used: personnelData.leaveUsed,
                            accruedMonthKey: personnelData.leaveAccruedMonth,
                        });
                        const offsetState = resolveOffsetState({
                            balance: personnelData.offsetBalance,
                            used: personnelData.offsetUsed,
                            resetYear: personnelData.offsetResetYear,
                        });
                        const offsetBalance = offsetState.balance;
                        const offsetUsed = offsetState.used;

                        const needsBalanceSync =
                            leaveState.shouldPersist
                            || offsetState.shouldPersist
                            || !Number.isFinite(personnelData.offsetBalance)
                            || !Number.isFinite(personnelData.offsetUsed);
                        if (needsBalanceSync && !balanceSyncInFlightRef.current) {
                            balanceSyncInFlightRef.current = true;
                            auth.currentUser?.getIdToken()
                                .then((token) =>
                                    fetch('/api/personnel/sync-balances', {
                                        method: 'POST',
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    })
                                )
                                .then(async (response) => {
                                    if (!response.ok) {
                                        throw new Error('Balance sync request failed.');
                                    }
                                })
                                .catch((syncError) => {
                                    console.error('Failed to sync leave/offset balances:', syncError);
                                })
                                .finally(() => {
                                    balanceSyncInFlightRef.current = false;
                                });
                        }

                        if (personnelData.passwordNeedsReset) {
                            setForceResetRequired(true);
                            setUser(
                                buildPersonnelUser({
                                    firebaseUser,
                                    personnelData,
                                    leaveState,
                                    offsetBalance,
                                    offsetUsed,
                                    forceReset: true,
                                })
                            );
                            setUserRole(null);
                        } else {
                            if (!personnelData.name || !personnelData.role) {
                                throw new Error(`Incomplete personnel data for UID: ${firebaseUser.uid}. Missing name or role.`);
                            }
                            setForceResetRequired(false);
                            setUser(
                                buildPersonnelUser({
                                    firebaseUser,
                                    personnelData,
                                    leaveState,
                                    offsetBalance,
                                    offsetUsed,
                                    forceReset: false,
                                })
                            );
                            setUserRole(isDeveloperRole(personnelData.role) ? 'Developer' : personnelData.role);
                        }
                        setIsLoading(false);
                    },
                    async (err: any) => {
                        if (err.code === 'unavailable') {
                            console.warn('Offline login failed: User profile not found in local cache.', err);
                            setError(
                                t(
                                    'offlineLoginFailed',
                                    "You are offline and your user profile isn't saved on this device. Please connect to the internet to log in for the first time."
                                )
                            );
                        } else {
                            console.error('Error fetching or validating user data:', err);
                            setError(
                                t(
                                    'fetchUserDataFailed',
                                    'Failed to fetch user data. Your account may be misconfigured. Please contact support.'
                                )
                            );
                        }
                        await auth.signOut();
                        setIsLoading(false);
                    }
                );
            } catch (err: any) {
                if (err.code === 'unavailable') {
                    console.warn('Offline login failed: User profile not found in local cache.', err);
                    setError(
                        t(
                            'offlineLoginFailed',
                            "You are offline and your user profile isn't saved on this device. Please connect to the internet to log in for the first time."
                        )
                    );
                } else {
                    console.error('Error fetching or validating user data:', err);
                    setError(
                        t(
                            'fetchUserDataFailed',
                            'Failed to fetch user data. Your account may be misconfigured. Please contact support.'
                        )
                    );
                }
                await auth.signOut();
            } finally {
                if (!personnelUnsubscribe) {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            if (personnelUnsubscribe) {
                personnelUnsubscribe();
            }
            unsubscribe();
        };
    }, [t]);

    return {
        user,
        setUser,
        userRole,
        isLoading,
        setIsLoading,
        error,
        setError,
        isForceResetRequired,
        setForceResetRequired,
    };
};

