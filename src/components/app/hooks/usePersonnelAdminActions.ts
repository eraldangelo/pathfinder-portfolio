import { useCallback, useState } from 'react';
import { auth, ensureFirebaseReady, firebaseApp } from '../../../services/firebase';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { NewPersonnelData } from '../../personnel/types/PersonnelTypes';

interface UsePersonnelAdminActionsParams {
    currentUserUid: string;
    showPopup: (message: string) => void;
    onLoginAgain: () => void;
}

export const usePersonnelAdminActions = ({ currentUserUid, showPopup, onLoginAgain }: UsePersonnelAdminActionsParams) => {
    const [activePersonnel, setActivePersonnel] = useState<PersonnelWithDetails | null>(null);
    const [isCreatePersonnelOpen, setIsCreatePersonnelOpen] = useState(false);

    const handleDeletePersonnel = useCallback(
        async (personnel: PersonnelWithDetails) => {
            if (!personnel?.uid) return false;
            if (typeof window === 'undefined') return false;

            const confirmed = window.confirm(`Delete ${personnel.name}? This will remove their profile and auth account.`);
            if (!confirmed) return false;

            const ready = await ensureFirebaseReady();
            const firebaseNamespace = firebaseApp;

            if (!ready || !firebaseNamespace?.auth) {
                showPopup('Firebase is not ready. Please refresh the page and try again.');
                return false;
            }

            const currentUser = auth?.currentUser ?? firebaseNamespace.auth().currentUser;
            if (!currentUser) {
                showPopup('You must be logged in to delete personnel.');
                return false;
            }

            try {
                const token = await currentUser.getIdToken();
                const response = await fetch('/api/personnel/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ uid: personnel.uid }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const message = errorData?.error || errorData?.message || 'Failed to delete personnel.';
                    showPopup(message);
                    return false;
                }

                showPopup(`Deleted ${personnel.name}.`);
                setActivePersonnel(null);

                if (personnel.uid === currentUserUid) {
                    try {
                        await auth?.signOut?.();
                    } catch {
                        // no-op
                    }
                    onLoginAgain();
                }

                return true;
            } catch (err: any) {
                showPopup(err?.message || 'Failed to delete personnel.');
                return false;
            }
        },
        [currentUserUid, onLoginAgain, showPopup]
    );

    const handleCreatePersonnel = useCallback(
        async (data: NewPersonnelData) => {
            const ready = await ensureFirebaseReady();
            const firebaseNamespace = firebaseApp;

            if (!ready || !firebaseNamespace?.auth) {
                showPopup('Firebase is not ready. Please refresh the page and try again.');
                return false;
            }

            const email = data.email.trim();
            const firstName = data.firstName.trim();
            const lastName = data.lastName.trim();
            const preferredName = data.preferredName.trim();
            const displayName = `${firstName} ${lastName}`.trim();
            const currentUser = auth?.currentUser ?? firebaseNamespace.auth().currentUser;
            if (!currentUser) {
                showPopup('You must be logged in to create personnel.');
                return false;
            }

            try {
                const token = await currentUser.getIdToken();
                const response = await fetch('/api/personnel/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        preferredName,
                        email,
                        password: data.password,
                        role: data.role,
                        branch: data.branch,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const message = errorData?.error || errorData?.message || 'Failed to create personnel.';
                    showPopup(message);
                    return false;
                }

                showPopup(`[[${displayName}]]'s profile created successfully.`);
                setIsCreatePersonnelOpen(false);
                return true;
            } catch (err: any) {
                showPopup(err?.message || 'Something went wrong. Please try again.');
                return false;
            }
        },
        [showPopup]
    );

    return {
        activePersonnel,
        setActivePersonnel,
        isCreatePersonnelOpen,
        setIsCreatePersonnelOpen,
        handleDeletePersonnel,
        handleCreatePersonnel,
    };
};
