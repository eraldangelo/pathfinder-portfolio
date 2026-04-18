export const getOptionalIp = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 1200);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        window.clearTimeout(timeout);
        if (!response.ok) return null;
        const payload = await response.json();
        return typeof payload?.ip === 'string' ? payload.ip : null;
    } catch {
        return null;
    }
};
