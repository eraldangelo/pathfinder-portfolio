import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, db } from '../../../services/firebase';
import { normalizeLeadEndorsedMessage } from '../../notifications/utils/notificationItemUtils';
import type { NotificationRecord } from '../../notifications/utils/notificationUtils';
import type { User } from '../../../types';
import { mapNotificationSnapshot } from './notifications/notificationMapping';
import { useNotificationSound } from './notifications/useNotificationSound';

export interface NotificationItem {
    id: number;
    message: string;
    eventKey?: string | null;
}

export type PersistentNotificationItem = NotificationRecord;

interface UseNotificationsParams {
    user?: User | null;
}

export const useNotifications = ({ user }: UseNotificationsParams = {}) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [persistentNotifications, setPersistentNotifications] = useState<PersistentNotificationItem[]>([]);
    const notificationIdRef = useRef(0);
    const isInitialSnapshotRef = useRef(true);
    const seenNotificationIdsRef = useRef<Set<string>>(new Set());
    const locallyPersistedNotificationIdsRef = useRef<Set<string>>(new Set());
    const { playNotificationSound } = useNotificationSound();
    const unreadCount = persistentNotifications.filter((notification) => !notification.read).length;
    const isAdminPhReadonly = (user?.email || '').toLowerCase() === 'admin_ph@example.com';

    useEffect(() => {
        if (!user?.uid || !db) {
            setPersistentNotifications([]);
            return;
        }

        isInitialSnapshotRef.current = true;
        seenNotificationIdsRef.current = new Set();

        const notificationsRef = db
            .collection('personnel')
            .doc(user.uid)
            .collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(50);

        const unsubscribe = notificationsRef.onSnapshot(
            (snapshot: any) => {
                const changes = snapshot.docChanges();
                if (isInitialSnapshotRef.current) {
                    changes.forEach((change: any) => {
                        seenNotificationIdsRef.current.add(change.doc.id);
                        if (locallyPersistedNotificationIdsRef.current.has(change.doc.id)) {
                            locallyPersistedNotificationIdsRef.current.delete(change.doc.id);
                        }
                    });
                    isInitialSnapshotRef.current = false;
                } else {
                    let incomingUnreadCount = 0;
                    changes
                        .filter((change: any) => change.type === 'added')
                        .forEach((change: any) => {
                            const docId = change.doc.id;
                            if (locallyPersistedNotificationIdsRef.current.has(docId)) {
                                locallyPersistedNotificationIdsRef.current.delete(docId);
                                return;
                            }
                            if (seenNotificationIdsRef.current.has(docId)) return;
                            seenNotificationIdsRef.current.add(docId);
                            const data = change.doc.data() || {};
                            if (data.read === true) return;
                            incomingUnreadCount += 1;
                            const toastId = notificationIdRef.current++;
                            const rawMessage = String(data.message ?? '');
                            const normalizedMessage = normalizeLeadEndorsedMessage(rawMessage) || rawMessage;
                            setNotifications((prev) => [
                                ...prev,
                                {
                                    id: toastId,
                                    message: normalizedMessage,
                                    eventKey: data.eventKey ?? null,
                                },
                            ]);
                            setTimeout(() => {
                                setNotifications((prev) => prev.filter((item) => item.id !== toastId));
                            }, 8000);
                        });
                    for (let i = 0; i < incomingUnreadCount; i += 1) {
                        const delayMs = i * 420;
                        setTimeout(() => {
                            playNotificationSound();
                        }, delayMs);
                    }
                }

                const canWrite = Boolean(auth?.currentUser?.uid && user?.uid && auth.currentUser.uid === user.uid);
                const { items, toMigrate } = mapNotificationSnapshot(snapshot, isAdminPhReadonly);
                setPersistentNotifications(items);
                if (canWrite && toMigrate.length) {
                    const batch = db.batch();
                    const notificationsRef = db.collection('personnel').doc(user.uid).collection('notifications');
                    toMigrate.forEach((update) => {
                        batch.update(notificationsRef.doc(update.id), { message: update.message });
                    });
                    batch.commit().catch((err) => {
                        console.error('Error migrating notification messages:', err);
                    });
                }
            },
            (err: any) => {
                console.error('Error fetching notifications:', err);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, isAdminPhReadonly, playNotificationSound]);

    const showPopup = useCallback((message: string, meta?: { eventKey?: string; persist?: boolean }) => {
        const id = notificationIdRef.current++;
        setNotifications((prev) => [...prev, { id, message, eventKey: meta?.eventKey ?? null }]);
        playNotificationSound();
        const shouldPersist = meta?.persist !== false;
        const canPersist = shouldPersist && Boolean(user?.uid && db && auth?.currentUser?.uid === user.uid);
        if (canPersist) {
            const docRef = db.collection('personnel').doc(user.uid).collection('notifications').doc();
            locallyPersistedNotificationIdsRef.current.add(docRef.id);
            docRef
                .set({
                    message,
                    createdAt: new Date(),
                    read: false,
                    eventKey: meta?.eventKey ?? null,
                })
                .catch((err: any) => {
                    locallyPersistedNotificationIdsRef.current.delete(docRef.id);
                    console.error('Error saving notification:', err);
                });
        } else if (!user?.uid || !db) {
            if (shouldPersist) {
                setPersistentNotifications((prev) => [
                    { id: String(id), message, timestamp: new Date(), read: false, eventKey: meta?.eventKey ?? null },
                    ...prev,
                ]);
            }
        }
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 8000);
    }, [playNotificationSound, user?.uid]);

    const removeNotification = useCallback((id: number) => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const clearPersistentNotifications = useCallback(async () => {
        if (!user?.uid || !db || auth?.currentUser?.uid !== user.uid) {
            setPersistentNotifications([]);
            return;
        }

        if (!persistentNotifications.length) {
            return;
        }

        setPersistentNotifications((prev) =>
            prev.map((notification) => ({ ...notification, read: true }))
        );

        const batch = db.batch();
        const notificationsRef = db.collection('personnel').doc(user.uid).collection('notifications');

        persistentNotifications.forEach((notification) => {
            if (notification.id) {
                batch.update(notificationsRef.doc(notification.id), { read: true });
            }
        });

        try {
            await batch.commit();
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    }, [persistentNotifications, user?.uid]);

    return {
        notifications,
        persistentNotifications,
        unreadCount,
        showPopup,
        removeNotification,
        clearNotifications,
        clearPersistentNotifications,
        setPersistentNotifications,
    };
};
