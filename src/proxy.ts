import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = 'your-app.example.com';
const SCRIPT_SRC_HOSTS = [
  'https://challenges.cloudflare.com',
  'https://maps.googleapis.com',
  'https://maps.gstatic.com',
  'https://www.google.com',
  'https://www.gstatic.com',
  'https://www.recaptcha.net',
].join(' ');
const BASE_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src-attr 'none'",
  "connect-src 'self' https://*.googleapis.com https://maps.googleapis.com https://maps.gstatic.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://*.firebaseio.com wss://*.firebaseio.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://www.recaptcha.net",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
];
const STRICT_TRANSPORT_SECURITY = 'max-age=31536000; includeSubDomains';

const buildContentSecurityPolicy = (isProduction: boolean) =>
  [
    ...BASE_CONTENT_SECURITY_POLICY,
    `script-src 'self' 'unsafe-inline' ${SCRIPT_SRC_HOSTS}`,
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

const applySecurityHeaders = (response: NextResponse, isProduction: boolean) => {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(isProduction));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('Origin-Agent-Cluster', '?1');
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
  }
  return response;
};

export function proxy(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return applySecurityHeaders(NextResponse.next(), false);
  }

  const rawHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host;

  const requestHost = rawHost.split(',')[0]?.trim().toLowerCase().split(':')[0] ?? '';
  if (requestHost === CANONICAL_HOST) {
    return applySecurityHeaders(NextResponse.next(), true);
  }

  if (!requestHost.endsWith('.run.app')) {
    return applySecurityHeaders(NextResponse.next(), true);
  }

  const targetUrl = request.nextUrl.clone();
  targetUrl.protocol = 'https:';
  targetUrl.hostname = CANONICAL_HOST;
  targetUrl.port = '';
  return applySecurityHeaders(NextResponse.redirect(targetUrl, 308), true);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
