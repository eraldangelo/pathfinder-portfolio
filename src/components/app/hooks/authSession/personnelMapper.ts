import type { Personnel } from '../../../../data/personnel';
import type { User } from '../../../../types';
import type { FirebaseUser } from '../../../../services/firebase';

interface LeaveState {
    balance: number;
    used: number;
    accruedMonthKey?: string | null;
}

interface BuildPersonnelUserParams {
    firebaseUser: FirebaseUser;
    personnelData: Personnel;
    leaveState: LeaveState;
    offsetBalance: number;
    offsetUsed: number;
    forceReset: boolean;
}

export const buildPersonnelUser = ({
    firebaseUser,
    personnelData,
    leaveState,
    offsetBalance,
    offsetUsed,
    forceReset,
}: BuildPersonnelUserParams): User => {
    if (forceReset) {
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: personnelData.name || 'New User',
            firstName: personnelData.firstName || null,
            lastName: personnelData.lastName || null,
            preferredName: null,
            dob: null,
            photoURL: null,
            personalEmail: personnelData.personalEmail || null,
            personalMobileCountryCode: personnelData.personalMobileCountryCode || null,
            personalMobileNumber: personnelData.personalMobileNumber || null,
            businessMobileCountryCode: personnelData.businessMobileCountryCode || null,
            businessMobileNumber: personnelData.businessMobileNumber || null,
            leaveBalance: leaveState.balance,
            leaveUsed: leaveState.used,
            leaveAccruedMonth: leaveState.accruedMonthKey,
            offsetBalance,
            offsetUsed,
        };
    }

    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: personnelData.name,
        firstName: personnelData.firstName || null,
        lastName: personnelData.lastName || null,
        preferredName: personnelData.preferredName || null,
        dob: personnelData.dob || null,
        photoURL: personnelData.photoURL || firebaseUser.photoURL,
        branch: personnelData.branch,
        personalEmail: personnelData.personalEmail || null,
        personalMobileCountryCode: personnelData.personalMobileCountryCode || null,
        personalMobileNumber: personnelData.personalMobileNumber || null,
        businessMobileCountryCode: personnelData.businessMobileCountryCode || null,
        businessMobileNumber: personnelData.businessMobileNumber || null,
        leaveBalance: leaveState.balance,
        leaveUsed: leaveState.used,
        leaveAccruedMonth: leaveState.accruedMonthKey,
        offsetBalance,
        offsetUsed,
    };
};
