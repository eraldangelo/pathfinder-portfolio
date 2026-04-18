import type { ApplicationInfo } from '../../../data/applications';

const normalizeStatusKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const statusIncludesKeyword = (statusValue: string | null | undefined, keyword: string) => {
  const keywordKey = normalizeStatusKey(keyword);
  if (!keywordKey) return false;
  return normalizeStatusKey(statusValue).includes(keywordKey);
};

export const hasStatusInCurrentOrHistory = (application: ApplicationInfo, keyword: string) => {
  if (statusIncludesKeyword(application.status, keyword)) {
    return true;
  }

  return Array.isArray(application.history)
    ? application.history.some((entry) => statusIncludesKeyword(entry?.status, keyword))
    : false;
};

export const hasAnyStatusInCurrentOrHistory = (
  application: ApplicationInfo,
  keywords: readonly string[]
) => keywords.some((keyword) => hasStatusInCurrentOrHistory(application, keyword));
