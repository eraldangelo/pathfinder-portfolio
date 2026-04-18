const BASE_URL = (process.env.APP_BASE_URL || 'https://your-app.example.com/')
  .replace(/\/+$/, '');
const CANONICAL_HOST = new URL(BASE_URL).host;

function normalize(urlPath) {
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
  return `${BASE_URL}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
}

async function check({ name, path, method = 'GET', expectStatus, body, headers, expectResponse }) {
  const url = normalize(path);
  const requestHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  };
  const res = await fetch(url, {
    method,
    redirect: 'manual',
    headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const statusOk = typeof expectStatus === 'function' ? expectStatus(res.status) : res.status === expectStatus;
  const responseOk = typeof expectResponse === 'function' ? expectResponse(res) : true;
  const location = res.headers.get('location');
  return { ok: statusOk && responseOk, name, status: res.status, location, url };
}

async function main() {
  const checks = [
    {
      name: 'Home route responds',
      path: '/',
      expectStatus: (s) => s >= 200 && s < 400,
    },
    {
      name: 'Login route responds',
      path: '/login',
      expectStatus: (s) => s >= 200 && s < 400,
    },
    {
      name: 'Navigation route responds',
      path: '/navigation',
      expectStatus: (s) => s >= 200 && s < 400,
    },
    {
      name: 'Invalid Turnstile payload is rejected',
      path: '/api/turnstile/verify',
      method: 'POST',
      body: { token: 'invalid' },
      expectStatus: 403,
    },
    {
      name: 'Canonical host redirect stays enforced',
      path: '/',
      method: 'GET',
      headers: { 'x-forwarded-host': 'noncanonical-smoke.run.app' },
      expectStatus: 308,
      expectResponse: (res) => {
        const location = String(res.headers.get('location') || '');
        return location.includes(CANONICAL_HOST);
      },
    },
  ];

  const results = [];
  for (const item of checks) {
    try {
      results.push(await check(item));
    } catch (error) {
      results.push({
        ok: false,
        name: item.name,
        status: -1,
        url: normalize(item.path),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let failed = 0;
  for (const result of results) {
    const prefix = result.ok ? 'PASS' : 'FAIL';
    const locationInfo = result.location ? ` -> ${result.location}` : '';
    const details = result.error ? `${result.status} (${result.error})` : `${result.status}${locationInfo}`;
    console.log(`${prefix} - ${result.name} -> ${details} [${result.url}]`);
    if (!result.ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`postdeploy check failed: ${failed} issue(s)`);
    process.exit(1);
  }
  console.log('postdeploy check passed');
}

main();
