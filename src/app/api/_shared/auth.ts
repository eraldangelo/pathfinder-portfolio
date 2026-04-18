import { NextResponse } from 'next/server';

type BearerTokenOptions = {
  trim?: boolean;
};

type RequireBearerTokenOptions = BearerTokenOptions & {
  message?: string;
};

const ID_TOKEN_VERIFY_ERROR_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
  'auth/invalid-session-cookie',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/tenant-id-mismatch',
  'auth/user-disabled',
  'auth/user-not-found',
]);

const getErrorCode = (error: unknown) =>
  String((error as { code?: unknown } | null)?.code || '').trim().toLowerCase();

const getErrorMessage = (error: unknown) =>
  String((error as { message?: unknown } | null)?.message || '').trim().toLowerCase();

export const isIdTokenVerificationError = (error: unknown) => {
  const code = getErrorCode(error);
  if (ID_TOKEN_VERIFY_ERROR_CODES.has(code)) return true;

  const message = getErrorMessage(error);
  return message.includes('id token')
    || message.includes('id-token')
    || message.includes('jwt');
};

export const toUnauthorizedResponseFromVerifyError = (
  error: unknown,
  message = 'Unauthorized.',
) => (isIdTokenVerificationError(error)
  ? NextResponse.json({ error: message }, { status: 401 })
  : null);

export const extractBearerToken = (headerValue: string, options?: BearerTokenOptions) => {
  const rawHeader = String(headerValue || '');
  if (!rawHeader.startsWith('Bearer ')) return '';
  const token = rawHeader.slice(7);
  return options?.trim ? token.trim() : token;
};

export const readBearerToken = (request: Request, options?: BearerTokenOptions) => {
  const authHeader = request.headers.get('authorization') || '';
  return extractBearerToken(authHeader, options);
};

export const requireBearerToken = (request: Request, options?: RequireBearerTokenOptions) => {
  const token = readBearerToken(request, options);
  if (token) {
    return { token, response: null as NextResponse | null };
  }
  const message = options?.message || 'Missing token.';
  return {
    token: '',
    response: NextResponse.json({ error: message }, { status: 401 }),
  };
};
