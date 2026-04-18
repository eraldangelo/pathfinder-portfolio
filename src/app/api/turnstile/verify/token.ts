import { z } from 'zod';
import { NextResponse } from 'next/server';
import { readRequestTextWithinLimit } from '@/app/api/_shared/requestSize';

type VerifyRequest = {
  token?: string;
  'cf-turnstile-response'?: string;
};

type ParseTurnstileTokenOptions = {
  maxBytes?: number;
  tooLargeMessage?: string;
};

type ParseTurnstileTokenResult = {
  token: string;
  response: NextResponse | null;
};

const turnstileJsonBodySchema = z
  .object({
    token: z.string().trim().min(1).max(2048).optional(),
    'cf-turnstile-response': z.string().trim().min(1).max(2048).optional(),
  })
  .passthrough();

const normalizeToken = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim();
  if (!normalized || normalized.length > 2048) return '';
  return normalized;
};

const extractTokenFromMultipartText = (rawText: string) => {
  const tokenPatterns = [
    /name="cf-turnstile-response"\s*\r?\n\r?\n([^\r\n]+)/i,
    /name="token"\s*\r?\n\r?\n([^\r\n]+)/i,
  ];
  for (const pattern of tokenPatterns) {
    const match = rawText.match(pattern);
    const token = normalizeToken(match?.[1]);
    if (token) return token;
  }
  return '';
};

export const parseTurnstileToken = async (
  request: Request,
  options: ParseTurnstileTokenOptions = {},
): Promise<ParseTurnstileTokenResult> => {
  const sized = await readRequestTextWithinLimit(request, {
    maxBytes: options.maxBytes ?? 8 * 1024,
    tooLargeMessage: options.tooLargeMessage ?? 'Turnstile payload is too large.',
  });
  if (sized.response) {
    return { token: '', response: sized.response };
  }

  const contentType = request.headers.get('content-type') || '';
  const rawText = sized.text || '';

  if (contentType.includes('application/json')) {
    let parsedJson: VerifyRequest | null = null;
    try {
      parsedJson = JSON.parse(rawText) as VerifyRequest;
    } catch {
      parsedJson = null;
    }
    const body = turnstileJsonBodySchema.safeParse(parsedJson);
    if (!body.success) return { token: '', response: null };
    const payload = body.data;
    if (typeof payload?.token === 'string') {
      return { token: normalizeToken(payload.token), response: null };
    }
    if (typeof payload?.['cf-turnstile-response'] === 'string') {
      return { token: normalizeToken(payload['cf-turnstile-response']), response: null };
    }
    return { token: '', response: null };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(rawText);
    const token = normalizeToken(form.get('cf-turnstile-response') ?? form.get('token'));
    return { token, response: null };
  }

  if (contentType.includes('multipart/form-data')) {
    const token = extractTokenFromMultipartText(rawText);
    return { token, response: null };
  }

  if (contentType.includes('form')) {
    const form = new URLSearchParams(rawText);
    const token = normalizeToken(form.get('cf-turnstile-response') ?? form.get('token'));
    return { token, response: null };
  }

  return { token: '', response: null };
};
