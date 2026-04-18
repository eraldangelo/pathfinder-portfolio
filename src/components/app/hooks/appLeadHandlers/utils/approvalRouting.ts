import type {
    ApprovalRoleKey,
    BranchChangeApproverRecipient,
    BranchKey,
} from '../../../../../types/branchChangeRequest';

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const getBranchKey = (branch: string): BranchKey => {
    const normalized = normalize(branch);
    if (!normalized) return '';
    if (normalized.includes('makati') || normalized.includes('manila')) return 'manila';
    if (normalized.includes('davao')) return 'davao';
    if (normalized.includes('cebu')) return 'cebu';
    if (normalized.includes('pampanga')) return 'pampanga';
    return '';
};

export const getBranchQueryValues = (branchKey: BranchKey) => {
    if (branchKey === 'manila') {
        return ['Manila', 'Makati', 'Manila City', 'Makati City', 'Metro Manila', 'Manila Branch'];
    }
    if (branchKey === 'davao') return ['Davao', 'Davao City'];
    if (branchKey === 'cebu') return ['Cebu', 'Cebu City'];
    if (branchKey === 'pampanga') return ['Pampanga', 'San Fernando'];
    return [];
};

export const getCanonicalBranchLabel = (branchKey: BranchKey) => {
    if (branchKey === 'manila') return 'Manila';
    if (branchKey === 'davao') return 'Davao';
    if (branchKey === 'cebu') return 'Cebu';
    if (branchKey === 'pampanga') return 'Pampanga';
    return '';
};

export const normalizeApproverRoleKey = (role?: string | null): ApprovalRoleKey | '' => {
    const normalizedRole = normalize(role);
    if (!normalizedRole) return '';
    if (normalizedRole === 'operations') return 'operations';
    if (normalizedRole === 'branch manager') return 'branch manager';
    if (normalizedRole === 'developer' || normalizedRole.startsWith('developer (')) {
        return 'developer';
    }
    return '';
};

export const getApproverRoleLabel = (branchKey: BranchKey) => {
    if (branchKey === 'cebu' || branchKey === 'pampanga') {
        return 'Branch Manager';
    }
    if (branchKey === 'manila' || branchKey === 'davao') {
        return 'Operations';
    }
    return 'Manager';
};

export const makePossessive = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return '';
    const lastChar = trimmed[trimmed.length - 1];
    return lastChar.toLowerCase() === 's' ? `${trimmed}'` : `${trimmed}'s`;
};

const matchesRole = (roleValue: string, targetRole: ApprovalRoleKey) => {
    const roleKey = normalizeApproverRoleKey(roleValue);
    if (roleKey) return roleKey === targetRole;
    const role = normalize(roleValue);
    return role === targetRole || role.startsWith(targetRole) || role.includes(targetRole);
};

export const getApproverTargets = (branch: string, requiresDavaoApprover: boolean) => {
    const branchKey = getBranchKey(branch);
    if (!branchKey) {
        return { branchKey, targetBranchKey: '' as BranchKey, targetRoles: [] as ApprovalRoleKey[] };
    }

    const branchConfig: Record<Exclude<BranchKey, ''>, ApprovalRoleKey[]> = {
        manila: ['operations', 'developer'],
        davao: ['operations'],
        cebu: ['branch manager'],
        pampanga: ['branch manager'],
    };

    const targetBranchKey: BranchKey = requiresDavaoApprover ? 'davao' : branchKey;
    const targetRoles: ApprovalRoleKey[] = requiresDavaoApprover
        ? ['operations']
        : branchConfig[targetBranchKey as Exclude<BranchKey, ''>] || [];
    return { branchKey, targetBranchKey, targetRoles };
};

export type ApproverRecipient = BranchChangeApproverRecipient;

export const pickApproverName = (recipients: ApproverRecipient[]) => {
    const priorities: ApprovalRoleKey[] = ['operations', 'branch manager', 'developer'];
    for (const priority of priorities) {
        const match = recipients.find((recipient) => matchesRole(recipient.role, priority));
        if (match?.name) return match.name;
    }
    return recipients.find((recipient) => recipient.name)?.name ?? null;
};

export interface ApproverRecipientDoc {
    id: string;
    data: Record<string, unknown>;
}

const toStringOrNull = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
};

const toBoolean = (value: unknown, fallback: boolean) => {
    if (typeof value === 'boolean') return value;
    return fallback;
};

export const mapApproverRecipientDoc = ({ id, data }: ApproverRecipientDoc): ApproverRecipient | null => {
    if (!id) return null;

    const role = toStringOrNull(data.role) || '';
    const branch = toStringOrNull(data.branch);
    const roleKey = normalizeApproverRoleKey(toStringOrNull(data.approvalRoleKey) || role);
    const branchKey = getBranchKey(toStringOrNull(data.approvalBranchKey) || branch || '');
    const inferredCanApprove = roleKey === 'operations' || roleKey === 'branch manager' || roleKey === 'developer';

    return {
        id,
        name: toStringOrNull(data.name) || toStringOrNull(data.fullName),
        role,
        roleKey,
        branch,
        branchKey,
        canApproveBranchChange: toBoolean(data.canApproveBranchChange, inferredCanApprove),
        isActive: toBoolean(data.isActive, true),
    };
};

export const mapApproverRecipientDocs = (docs: ApproverRecipientDoc[]) =>
    docs
        .map((doc) => mapApproverRecipientDoc(doc))
        .filter((recipient): recipient is ApproverRecipient => Boolean(recipient?.id));

export const filterApproverRecipients = (
    recipients: ApproverRecipient[],
    {
        excludeUid,
        targetBranchKey,
        targetRoles,
    }: {
        excludeUid: string;
        targetBranchKey: BranchKey;
        targetRoles: ApprovalRoleKey[];
    }
): ApproverRecipient[] => {
    return recipients.filter((recipient) => {
        if (!recipient.id || recipient.id === excludeUid) return false;
        if (!recipient.isActive) return false;
        if (!recipient.canApproveBranchChange) return false;
        if (!recipient.branchKey || recipient.branchKey !== targetBranchKey) return false;

        const recipientRoleKey = recipient.roleKey || normalizeApproverRoleKey(recipient.role);
        return targetRoles.some((role) => recipientRoleKey === role || matchesRole(recipient.role, role));
    });
};
