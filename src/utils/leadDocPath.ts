const normalizeDocPath = (value?: string | null) => String(value || '').trim().replace(/^\/+|\/+$/g, '');

const isDocumentPath = (value: string) => {
    if (!value) return false;
    const segments = value.split('/').filter(Boolean);
    return segments.length >= 2 && segments.length % 2 === 0;
};

export const resolveLeadDocPath = (leadId: string, leadDocPath?: string | null) => {
    const normalizedPath = normalizeDocPath(leadDocPath);
    if (isDocumentPath(normalizedPath)) {
        return normalizedPath;
    }
    return `leads/${leadId}`;
};

export const isRootLeadDocPath = (leadDocPath?: string | null) => {
    const normalizedPath = normalizeDocPath(leadDocPath);
    const segments = normalizedPath.split('/').filter(Boolean);
    return segments.length === 2 && segments[0] === 'leads';
};

export const getLeadDocRef = (dbInstance: any, leadId: string, leadDocPath?: string | null) =>
    dbInstance.doc(resolveLeadDocPath(leadId, leadDocPath));
