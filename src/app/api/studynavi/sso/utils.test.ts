import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SSO_CONTINUE_PATH,
  buildStudyNaviLoginUrl,
  getSafeContinuePath,
  parseStudyNaviBaseUrl,
} from './utils';

test('getSafeContinuePath keeps only safe local paths', () => {
  assert.equal(getSafeContinuePath('/navigation'), '/navigation');
  assert.equal(getSafeContinuePath('/navigation?tab=dashboard'), '/navigation?tab=dashboard');
  assert.equal(getSafeContinuePath('https://evil.test'), DEFAULT_SSO_CONTINUE_PATH);
  assert.equal(getSafeContinuePath('//evil.test/path'), DEFAULT_SSO_CONTINUE_PATH);
  assert.equal(getSafeContinuePath('relative/path'), DEFAULT_SSO_CONTINUE_PATH);
});

test('parseStudyNaviBaseUrl prefers STUDYNAVI_URL and rejects invalid URLs', () => {
  const env = process.env as Record<string, string | undefined>;
  const prevPrivate = process.env.STUDYNAVI_URL;
  const prevPublic = process.env.NEXT_PUBLIC_STUDYNAVI_URL;
  const prevAllowlist = process.env.STUDYNAVI_ALLOWED_HOSTS;
  const prevNodeEnv = process.env.NODE_ENV;
  try {
    env.NODE_ENV = 'test';
    env.STUDYNAVI_ALLOWED_HOSTS = '';
    env.STUDYNAVI_URL = 'https://example.studynavi.test';
    env.NEXT_PUBLIC_STUDYNAVI_URL = 'https://public.studynavi.test';
    assert.equal(parseStudyNaviBaseUrl()?.toString(), 'https://example.studynavi.test/');

    env.STUDYNAVI_URL = 'http://example.studynavi.test';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_URL = 'https://example.studynavi.test';
    env.STUDYNAVI_ALLOWED_HOSTS = 'allowed.studynavi.test';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_ALLOWED_HOSTS = 'allowed.studynavi.test,example.studynavi.test';
    assert.equal(parseStudyNaviBaseUrl()?.toString(), 'https://example.studynavi.test/');

    env.NODE_ENV = 'production';
    env.STUDYNAVI_ALLOWED_HOSTS = '';
    env.STUDYNAVI_URL = 'https://localhost:3001';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_URL = 'https://[::1]:3001';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_URL = 'https://10.10.10.10';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_URL = 'https://portal.local';
    assert.equal(parseStudyNaviBaseUrl(), null);

    env.STUDYNAVI_URL = '';
    env.NEXT_PUBLIC_STUDYNAVI_URL = 'invalid-url';
    assert.equal(parseStudyNaviBaseUrl(), null);
  } finally {
    env.STUDYNAVI_URL = prevPrivate;
    env.NEXT_PUBLIC_STUDYNAVI_URL = prevPublic;
    env.STUDYNAVI_ALLOWED_HOSTS = prevAllowlist;
    env.NODE_ENV = prevNodeEnv;
  }
});

test('buildStudyNaviLoginUrl keeps sso token in hash only', () => {
  const url = buildStudyNaviLoginUrl({
    baseUrl: new URL('https://studynavi.example'),
    continueTo: '/dashboard',
    ssoToken: 'token-123',
  });
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/login');
  assert.equal(parsed.searchParams.get('next'), '/dashboard');
  assert.equal(parsed.searchParams.get('source'), 'pathfinder');
  assert.equal(parsed.searchParams.get('ssoToken'), null);
  assert.equal(parsed.hash, '#ssoToken=token-123');
});
