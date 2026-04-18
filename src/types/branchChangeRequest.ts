export interface BranchChangeRequestFormData {
    reason: string;
    newBranch: string;
    newCountry?: string;
}

export type BranchKey = 'manila' | 'davao' | 'cebu' | 'pampanga' | '';
export type ApprovalRoleKey = 'operations' | 'branch manager' | 'developer';

export type BranchChangeRequestStatus = 'pending' | 'approved' | 'rejected';
export type BranchChangeNotificationStatus = 'pending' | 'sent' | 'failed';

export interface BranchChangeRequestRecord {
    status: BranchChangeRequestStatus;
    reason: string;
    requesterId: string;
    requesterName: string;
    requesterRole: string | null;
    currentBranch: string | null;
    requestedBranch: string;
    requestedCountry: string | null;
    createdAt: unknown;
    updatedAt: unknown;
}

export interface BranchChangeApproverSummary {
    targetBranchKey: BranchKey;
    targetRoles: ApprovalRoleKey[];
    matchedRecipientCount: number;
    matchedRecipientIds: string[];
}

export interface BranchChangeQueueRecord extends BranchChangeRequestRecord {
    requestId: string;
    sourceBranchKey: BranchKey;
    targetBranchKey: BranchKey;
    targetRoles: ApprovalRoleKey[];
    notificationStatus: BranchChangeNotificationStatus;
    notificationAttemptedAt: unknown | null;
    notificationSentAt: unknown | null;
    notificationError: string | null;
    approverSummary: BranchChangeApproverSummary | null;
}

export interface BranchChangeApproverRecipient {
    id: string;
    name: string | null;
    role: string;
    roleKey: ApprovalRoleKey | '';
    branch: string | null;
    branchKey: BranchKey;
    canApproveBranchChange: boolean;
    isActive: boolean;
}
