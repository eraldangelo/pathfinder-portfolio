const ALLOWED_OUTBOUND_HOSTS = new Set([
  'api.openai.com',
  'challenges.cloudflare.com',
  'nominatim.openstreetmap.org',
  'maps.googleapis.com',
]);

const DEFAULT_SAFE_FETCH_TIMEOUT_MS = 10_000;
const RETRYABLE_FETCH_CAUSE_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

const resolveFetchUrl = (input: string | URL | Request) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isHttpsFallbackDisabled = () =>
  String(process.env.SAFE_SERVER_FETCH_DISABLE_FALLBACK || '').trim() === '1';

const shouldAttemptHttpsFallback = (error: unknown) => {
  const candidate = error as { cause?: { code?: string } } | null;
  const causeCode = String(candidate?.cause?.code || '').trim().toUpperCase();
  return RETRYABLE_FETCH_CAUSE_CODES.has(causeCode);
};

const toNodeHeaderRecord = (headersInit?: HeadersInit) => {
  const headers = new Headers(headersInit);
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
};

const normalizeFallbackRequestBody = async (body: BodyInit | null | undefined) => {
  if (!body) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  throw new Error('safeServerFetch fallback received unsupported request body type.');
};

const toResponseHeaders = (headers: Record<string, string | string[] | undefined>) => {
  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        responseHeaders.append(key, item);
      }
      continue;
    }
    if (typeof value === 'string') {
      responseHeaders.append(key, value);
    }
  }
  return responseHeaders;
};

const fallbackHttpsRequest = async (
  input: string | URL | Request,
  init: RequestInit | undefined,
  timeoutMs: number,
) => {
  const parsed = parseUrl(resolveFetchUrl(input));
  if (!parsed) {
    throw new Error(`Invalid outbound request URL: ${resolveFetchUrl(input)}`);
  }

  const { request } = await import('node:https');
  const method = String(init?.method || 'GET').toUpperCase();
  const headers = toNodeHeaderRecord(init?.headers);
  const requestBody = await normalizeFallbackRequestBody(init?.body);
  if (requestBody !== undefined && !headers['content-length']) {
    headers['content-length'] = String(
      typeof requestBody === 'string' ? Buffer.byteLength(requestBody) : requestBody.byteLength,
    );
  }

  return new Promise<Response>((resolve, reject) => {
    const signal = init?.signal;
    const handleAbort = () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      req.destroy(abortError);
    };

    if (signal?.aborted) {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      reject(abortError);
      return;
    }

    const req = request(
      parsed,
      {
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: string | Buffer) => {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        });
        res.on('end', () => {
          if (signal) signal.removeEventListener('abort', handleAbort);
          const body = Buffer.concat(chunks);
          resolve(new Response(body, {
            status: Number(res.statusCode || 500),
            headers: toResponseHeaders(res.headers as Record<string, string | string[] | undefined>),
          }));
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      const timeoutError = new Error(`safeServerFetch fallback timed out after ${timeoutMs}ms`);
      timeoutError.name = 'AbortError';
      req.destroy(timeoutError);
    });
    req.on('error', (error) => {
      if (signal) signal.removeEventListener('abort', handleAbort);
      reject(error);
    });
    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    if (requestBody !== undefined) {
      req.write(requestBody);
    }
    req.end();
  });
};

export const isAllowedOutboundUrl = (input: string | URL | Request) => {
  const value = resolveFetchUrl(input);
  const parsed = parseUrl(value);
  if (!parsed) return false;
  if (parsed.protocol !== 'https:') return false;
  return ALLOWED_OUTBOUND_HOSTS.has(parsed.host.toLowerCase());
};

export const assertAllowedOutboundUrl = (input: string | URL | Request) => {
  if (isAllowedOutboundUrl(input)) return;
  throw new Error(`Blocked outbound request host: ${resolveFetchUrl(input)}`);
};

type SafeServerFetchOptions = {
  timeoutMs?: number;
};

const normalizeTimeoutMs = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SAFE_FETCH_TIMEOUT_MS;
  if (value <= 0) return 0;
  return Math.floor(value);
};

export const safeServerFetch = async (
  input: string | URL | Request,
  init?: RequestInit,
  options?: SafeServerFetchOptions,
) => {
  assertAllowedOutboundUrl(input);

  const timeoutMs = normalizeTimeoutMs(options?.timeoutMs);
  if (timeoutMs === 0) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamSignal = init?.signal;
  const handleUpstreamAbort = () => controller.abort();

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener('abort', handleUpstreamAbort, { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (!shouldAttemptHttpsFallback(error)) throw error;
    if (isHttpsFallbackDisabled()) throw error;
    return fallbackHttpsRequest(input, { ...init, signal: controller.signal }, timeoutMs);
  } finally {
    clearTimeout(timeout);
    if (upstreamSignal) {
      upstreamSignal.removeEventListener('abort', handleUpstreamAbort);
    }
  }
};

export const __shouldAttemptHttpsFallbackForTests = shouldAttemptHttpsFallback;
