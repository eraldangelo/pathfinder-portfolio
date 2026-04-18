import type { PersonnelWithDetails } from '../../../../data/personnel';
import type { User } from '../../../../types';
import {
    isBranchManagerRole,
    isConsultantLikeRole,
    isCounsellorRole,
    isDeveloperRole,
    isMarketingRole,
    isOperationsLikeRole,
} from '../../../../utils/roles';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import { TABS_ORDER } from './StudentInfoModalConstants';
import type { Tab } from './StudentInfoModalTypes';

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isLeadAssignedToUser = (user: User, lead: Lead) => {
    const assignedUid = (lead.assignedCounsellorUid || '').trim();
    if (assignedUid) {
        return Boolean(user.uid) && user.uid === assignedUid;
    }

    const assignedName = normalizeValue(lead.assignedCounsellor);
    const userName = normalizeValue(user.displayName);
    return Boolean(assignedName && userName && assignedName === userName);
};

const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) {
        return { firstName: '', middleName: '', lastName: '' };
    }
    if (nameParts.length === 1) {
        return { firstName: nameParts[0], middleName: '', lastName: '' };
    }
    if (nameParts.length === 2) {
        return { firstName: nameParts[0], middleName: '', lastName: nameParts[1] };
    }
    return {
        firstName: nameParts[0],
        middleName: nameParts.slice(1, -1).join(' '),
        lastName: nameParts[nameParts.length - 1],
    };
};

export const applyLeadInputChange = (
    prev: Lead,
    input: { name: string; value: string; type: string; checked: boolean }
) => {
    const { name, value, type, checked } = input;
    const isCheckbox = type === 'checkbox';
    const next: Lead = {
        ...prev,
        [name]: isCheckbox ? checked : value,
    };

    if (name === 'fullName') {
        const nameParts = splitFullName(value);
        next.firstName = nameParts.firstName;
        next.middleName = nameParts.middleName;
        next.lastName = nameParts.lastName;
    }

    if (name === 'isUsPassportHolder') {
        next.isUsPassportHolder = value === 'Yes';
    }

    if (name === 'hasWorked') {
        next.hasWorked = value === 'Yes';
    }

    if (['firstName', 'middleName', 'lastName'].includes(name)) {
        const { firstName, middleName, lastName } = next;
        next.fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    }

    if (name === 'isPermanentAddressSameAsPresent' && checked) {
        next.permanentAddress = prev.presentAddress;
    }

    if (name === 'presentAddress' && prev.isPermanentAddressSameAsPresent) {
        next.permanentAddress = value;
    }

    return next;
};

export const getIsMarketingRole = (userRole: string) => {
    return isMarketingRole(userRole);
};

export const getCanEditAdminTab = (userRole: string, isAdminLike: boolean) => {
    return isDeveloperRole(userRole) || isAdminLike;
};

export const getIsActionAllowed = (userRole: string, user: User, lead: Lead, isSubmission: boolean) => {
    if (isSubmission) return false;
    if (isDeveloperRole(userRole) || isOperationsLikeRole(userRole)) {
        return true;
    }
    // Branch Managers can only edit via Consultation tab for leads assigned to them.
    if (isBranchManagerRole(userRole)) {
        return false;
    }
    if (isCounsellorRole(userRole)) {
        return isLeadAssignedToUser(user, lead);
    }
    return false;
};

export const getCanCreateApplication = (userRole: string, user: User, lead: Lead) => {
    if (isDeveloperRole(userRole) || isOperationsLikeRole(userRole)) return true;
    if (!isConsultantLikeRole(userRole)) return false;
    return isLeadAssignedToUser(user, lead);
};

export const getCanEditConsultationTab = (
    userRole: string,
    user: User,
    lead: Lead
) => {
    if (isDeveloperRole(userRole)) return true;
    if (!isConsultantLikeRole(userRole)) return false;
    return isLeadAssignedToUser(user, lead);
};

export const getVisibleTabs = (userRole: string, isAdminLike: boolean, isMarketingRole: boolean): Tab[] => {
    let tabs: Tab[];

    const canSeeLogs =
        isDeveloperRole(userRole)
        || isOperationsLikeRole(userRole)
        || isBranchManagerRole(userRole)
        || isMarketingRole;
    tabs = canSeeLogs ? TABS_ORDER : TABS_ORDER.filter((tab) => tab !== 'logs');

    const canSeeAdminTab = isDeveloperRole(userRole)
        || isOperationsLikeRole(userRole)
        || isAdminLike
        || isMarketingRole;

    if (!canSeeAdminTab) {
        return tabs.filter((tab) => tab !== 'admin');
    }

    if (isAdminLike) {
        return tabs.filter((tab) => tab !== 'consultation' && tab !== 'application');
    }

    return tabs;
};

export const buildEndorsementOptions = (
    allPersonnel: PersonnelWithDetails[],
    branchToMatch?: string | null
) => {
    const isEducationCounsellor = (role?: string | null) => {
        const roleKey = normalizeValue(role);
        return roleKey === 'education consultant' || roleKey === 'education counsellor' || roleKey === 'education counselor';
    };

    const targetBranch = normalizeValue(branchToMatch);
    const unique = new Map<string, { uid: string; name: string }>();

    allPersonnel.forEach((person) => {
        if (!isEducationCounsellor(person.role)) return;
        if (targetBranch && normalizeValue(person.branch) !== targetBranch) return;
        if (!person.uid || !person.name) return;
        unique.set(person.uid, { uid: person.uid, name: person.name });
    });

    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
};
