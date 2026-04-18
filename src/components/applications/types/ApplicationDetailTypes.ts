export type ActionGuard = {
    isActionAllowed: boolean;
    disabledTitle: string;
    disabledClasses: string;
};

export type ApplicationDetailUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    branch?: string;
};
