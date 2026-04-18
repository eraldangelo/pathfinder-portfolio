import { isIP } from 'node:net';

const DEFAULT_CONTINUE_PATH = '/';
const LOCAL_HOSTNAME_PATTERN = /(^localhost$|\.localhost$)/i;

const normalizeHostname = (value: string) => value.trim().toLowerCase().replace(/^\[|\]$/g, '');

const isPrivateIpv4Host = (hostname: string) => {
  if (isIP(hostname) !== 4) return false;
  const octets = hostname.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = octets;
  return (
    a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 192 && b === 168)
    || (a === 172 && b >= 16 && b <= 31)
  );
};

const isPrivateIpv6Host = (hostname: string) => {
  if (isIP(hostname) !== 6) return false;
  const lower = hostname.toLowerCase();

  if (lower === '::1' || lower === '::' || lower === '0:0:0:0:0:0:0:1') return true;
  if (/^fe[89ab]/i.test(lower)) return true; // link-local fe80::/10
  if (/^f[cd]/i.test(lower)) return true; // unique-local fc00::/7

  if (lower.startsWith('::ffff:')) {
    const mappedV4 = lower.slice('::ffff:'.length);
    return isPrivateIpv4Host(mappedV4);
  }

  return false;
};

const isPrivateOrLocalHost = (hostname: string) => {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return true;
  if (LOCAL_HOSTNAME_PATTERN.test(normalized)) return true;
  if (normalized.endsWith('.local') || normalized.endsWith('.internal')) return true;
  if (isPrivateIpv4Host(normalized)) return true;
  if (isPrivateIpv6Host(normalized)) return true;
  return false;
};

type BuildStudyNaviLoginUrlOptions = {
  baseUrl: URL;
  continueTo: unknown;
  source?: string;
  ssoToken: string;
};

export const parseStudyNaviBaseUrl = () => {
  const raw = (process.env.STUDYNAVI_URL || process.env.NEXT_PUBLIC_STUDYNAVI_URL || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;

    const allowlist = String(process.env.STUDYNAVI_ALLOWED_HOSTS || '')
      .split(',')
      .map((item) => normalizeHostname(item))
      .filter(Boolean);
    const hostname = normalizeHostname(parsed.hostname);
    if (allowlist.length > 0 && !allowlist.includes(hostname)) return null;

    // Prevent accidental internal/loopback redirects in production environments.
    if (process.env.NODE_ENV === 'production' && isPrivateOrLocalHost(hostname)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const getSafeContinuePath = (value: unknown) => {
  if (typeof value !== 'string') return DEFAULT_CONTINUE_PATH;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_CONTINUE_PATH;
  }
  return trimmed;
};

export const buildStudyNaviLoginUrl = ({
  baseUrl,
  continueTo,
  source = 'pathfinder',
  ssoToken,
}: BuildStudyNaviLoginUrlOptions) => {
  const loginUrl = new URL('/login', baseUrl);
  loginUrl.searchParams.set('next', getSafeContinuePath(continueTo));
  loginUrl.searchParams.set('source', source);
  // Keep token out of query params to reduce leakage through logs/referrers.
  loginUrl.hash = new URLSearchParams({ ssoToken }).toString();
  return loginUrl.toString();
};

export const DEFAULT_SSO_CONTINUE_PATH = DEFAULT_CONTINUE_PATH;
