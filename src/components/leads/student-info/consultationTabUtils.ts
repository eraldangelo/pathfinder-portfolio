import type { Note } from '../leads-page/LeadsPageTypes';

const normalize = (value: string) => value.trim().toLowerCase();

const parseDob = (value?: string | null) => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return null;

    const ymdDash = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdDash) {
        const [, year, month, day] = ymdDash;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const ymdSlash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (ymdSlash) {
        const [, year, month, day] = ymdSlash;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmySlash) {
        const [, day, month, year] = dmySlash;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    return null;
};

const computeAge = (dob: Date) => {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
        now.getMonth() > dob.getMonth()
        || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());

    if (!hasHadBirthdayThisYear) {
        age -= 1;
    }

    return age >= 0 ? age : null;
};

const extractStatusSuffix = (subject: string) => {
    const colonIndex = subject.indexOf(':');
    if (colonIndex < 0) return null;
    return subject.slice(colonIndex + 1).trim() || null;
};

const isAdminNote = (subject: string, adminLegacySubject: string, adminBaseSubject: string) => {
    const subjectNormalized = normalize(subject);
    return (
        subjectNormalized === adminLegacySubject
        || subjectNormalized.startsWith(adminLegacySubject)
        || subjectNormalized.startsWith(adminBaseSubject)
    );
};

const isGenuineAdminNote = (subject: string, adminLegacySubject: string, adminBaseSubject: string) => {
    if (!isAdminNote(subject, adminLegacySubject, adminBaseSubject)) return false;
    const statusSuffix = normalize(extractStatusSuffix(subject) || '');
    return !statusSuffix || statusSuffix === 'genuine' || statusSuffix.includes('genuine');
};

const getLatestNote = (notes: Note[], predicate: (note: Note) => boolean) => {
    const filtered = notes.filter(predicate);
    if (!filtered.length) return null;
    return filtered
        .slice()
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
};

export const deriveAge = (dob?: string | null) => {
    const parsedDob = parseDob(dob);
    if (!parsedDob) return null;
    return computeAge(parsedDob);
};

export const resolveTagDetailsNote = (
    notes: Note[],
    adminLegacySubject: string,
    adminBaseSubject: string
) => {
    const latestAdminNote = getLatestNote(notes, (note) =>
        isAdminNote(note.subject || '', adminLegacySubject, adminBaseSubject)
    );
    const latestGenuineAdminNote = getLatestNote(notes, (note) =>
        isGenuineAdminNote(note.subject || '', adminLegacySubject, adminBaseSubject)
    );

    return latestGenuineAdminNote || latestAdminNote;
};
