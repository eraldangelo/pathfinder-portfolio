import { useEffect, useMemo, useState } from 'react';
import { branchesByCountry } from '../../../data/personnel';
import { db } from '../../../services/firebase';
import type { User } from '../../../types';
import { months } from '../utils/ProfilePageConstants';
import type { ProfileFormData } from '../types/ProfilePageTypes';

type UseProfileFormDataParams = {
    user: User | null;
    t: (key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => string;
    showPopup: (message: string) => void;
    onProfileUpdate: (newPhotoURL?: string, updates?: { preferredName?: string; dob?: string; firstName?: string; lastName?: string }) => void;
    onCloseEdit: () => void;
};

const getUserCountry = (userBranch: string) => {
    if (!userBranch) return '';
    return (
        Object.keys(branchesByCountry).find((country) =>
            branchesByCountry[country as keyof typeof branchesByCountry].includes(userBranch),
        ) || ''
    );
};

const getDobParts = (dob?: string | null) => {
    if (!dob) return { year: '', month: '', day: '' };
    const [year, month, day] = dob.split('-');
    return { year, month: months[parseInt(month, 10) - 1] || '', day };
};

const buildDobString = (day: string, month: string, year: string) => {
    const monthIndex = months.indexOf(month) + 1;
    const paddedMonth = monthIndex > 0 ? monthIndex.toString().padStart(2, '0') : '';
    const paddedDay = day ? day.toString().padStart(2, '0') : '';
    return year && paddedMonth && paddedDay ? `${year}-${paddedMonth}-${paddedDay}` : undefined;
};

export const useProfileFormData = ({ user, t, showPopup, onProfileUpdate, onCloseEdit }: UseProfileFormDataParams) => {
    const userBranch = user?.branch ?? '';
    const userCountry = useMemo(() => getUserCountry(userBranch), [userBranch]);
    const userDobParts = useMemo(() => getDobParts(user?.dob), [user?.dob]);

    const [profileData, setProfileData] = useState<ProfileFormData>({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        preferredName: user?.preferredName || '',
        day: userDobParts.day,
        month: userDobParts.month,
        year: userDobParts.year,
        personalMobileCountryCode: user?.personalMobileCountryCode || '+63',
        personalMobileNumber: user?.personalMobileNumber || '',
        businessMobileCountryCode: user?.businessMobileCountryCode || '+63',
        businessMobileNumber: user?.businessMobileNumber || '',
        personalEmail: user?.personalEmail || '',
        country: userCountry,
        branch: user?.branch || '',
    });

    useEffect(() => {
        if (!user) return;
        const dobParts = getDobParts(user.dob);
        setProfileData((prev) => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            preferredName: user.preferredName || '',
            day: dobParts.day,
            month: dobParts.month,
            year: dobParts.year,
            personalEmail: user.personalEmail ?? prev.personalEmail,
            personalMobileCountryCode: user.personalMobileCountryCode ?? prev.personalMobileCountryCode,
            personalMobileNumber: user.personalMobileNumber ?? prev.personalMobileNumber,
            businessMobileCountryCode: user.businessMobileCountryCode ?? prev.businessMobileCountryCode,
            businessMobileNumber: user.businessMobileNumber ?? prev.businessMobileNumber,
        }));
    }, [user]);

    const handleSaveProfile = async (updatedData: Partial<ProfileFormData>) => {
        if (!user?.uid) return;
        const merged = { ...profileData, ...updatedData };

        const wantsNameUpdate = ['firstName', 'lastName', 'preferredName', 'day', 'month', 'year'].some((key) => key in updatedData);
        const wantsContactUpdate = [
            'personalEmail',
            'personalMobileCountryCode',
            'personalMobileNumber',
            'businessMobileCountryCode',
            'businessMobileNumber',
        ].some((key) => key in updatedData);

        const updatesToPersist: Record<string, string | null> = {};

        if (wantsNameUpdate) {
            const newDobString = buildDobString(merged.day, merged.month, merged.year);
            const newFullName = [merged.firstName, merged.lastName].filter(Boolean).join(' ');

            updatesToPersist.name = newFullName;
            updatesToPersist.preferredName = merged.preferredName || '';
            if (newDobString) {
                updatesToPersist.dob = newDobString;
            }
        }

        if (wantsContactUpdate) {
            updatesToPersist.personalEmail = merged.personalEmail || '';
            updatesToPersist.personalMobileCountryCode = merged.personalMobileCountryCode || '';
            updatesToPersist.personalMobileNumber = merged.personalMobileNumber || '';
            updatesToPersist.businessMobileCountryCode = merged.businessMobileCountryCode || '';
            updatesToPersist.businessMobileNumber = merged.businessMobileNumber || '';
        }

        if (Object.keys(updatesToPersist).length === 0) {
            onCloseEdit();
            return;
        }

        try {
            const personnelDocRef = db.collection('personnel').doc(user.uid);
            await personnelDocRef.update(updatesToPersist);

            setProfileData(merged);

            if (wantsNameUpdate) {
                const newDobString = buildDobString(merged.day, merged.month, merged.year);
                onProfileUpdate(undefined, {
                    firstName: merged.firstName,
                    lastName: merged.lastName,
                    preferredName: merged.preferredName,
                    dob: newDobString,
                });
            }

            showPopup(t('profileUpdateSuccess'));
            onCloseEdit();
        } catch (error) {
            console.error('Error updating profile in Firestore:', error);
            showPopup('Failed to update profile. Please try again.');
        }
    };

    return {
        profileData,
        handleSaveProfile,
    };
};
