import { NextResponse } from 'next/server';

type BodySizeLimitOptions = {
  maxBytes: number;
  tooLargeMessage?: string;
};

const DEFAULT_TOO_LARGE_MESSAGE = 'Request body too large.';

const parseContentLengthHeader = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const toJsonMessage = (message: string, status = 413) =>
  NextResponse.json({ error: message }, { status });

const decodeTextWithinLimit = async (
  request: Request,
  maxBytes: number,
  tooLargeMessage: string,
) => {
  const stream = request.body;
  if (!stream) {
    return { text: '', response: null as NextResponse | null };
  }

  const reader = stream.getReader?.();
  if (!reader) {
    const text = await request.text();
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > maxBytes) {
      return { text: '', response: toJsonMessage(tooLargeMessage) };
    }
    return { text, response: null as NextResponse | null };
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => {});
      return { text: '', response: toJsonMessage(tooLargeMessage) };
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return { text, response: null as NextResponse | null };
};

export const getRequestContentLength = (request: Request) =>
  parseContentLengthHeader(request.headers.get('content-length'));

export const enforceRequestSizeHeaderLimit = (
  request: Request,
  options: BodySizeLimitOptions,
) => {
  const contentLength = getRequestContentLength(request);
  if (contentLength === null) return null;
  if (contentLength <= options.maxBytes) return null;
  return toJsonMessage(options.tooLargeMessage || DEFAULT_TOO_LARGE_MESSAGE);
};

export const readRequestTextWithinLimit = async (
  request: Request,
  options: BodySizeLimitOptions,
) => {
  const tooLargeMessage = options.tooLargeMessage || DEFAULT_TOO_LARGE_MESSAGE;
  const headerLimitResponse = enforceRequestSizeHeaderLimit(request, options);
  if (headerLimitResponse) {
    return { text: '', response: headerLimitResponse };
  }

  return decodeTextWithinLimit(request, options.maxBytes, tooLargeMessage);
};
