import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const mockTurnstileScript = async (page: Page) => {
  await page.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render: function (_el, options) {
            if (options && typeof options.callback === 'function') {
              setTimeout(function () { options.callback('smoke-token'); }, 10);
            }
            return 1;
          },
          reset: function () {},
          remove: function () {}
        };
      `,
    });
  });
};

const warmTurnstileVerifyRoute = async (request: APIRequestContext) => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await request.post('/api/turnstile/verify', {
        data: {},
        timeout: 45_000,
      });
      // Any non-404 response means the route is compiled and reachable.
      if (response.status() !== 404) return;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
};

test.beforeAll(async ({ request }) => {
  await warmTurnstileVerifyRoute(request);
});

test('login page wiring smoke: controls render and submit unlocks after captcha callback', async ({ page }) => {
  await mockTurnstileScript(page);
  await page.goto('/login');

  await expect(page.getByTestId('login-email-input')).toBeVisible();
  await expect(page.getByTestId('login-password-input')).toBeVisible();
  await expect(page.getByTestId('login-turnstile-container')).toBeAttached();

  await page.getByTestId('login-email-input').fill('smoke-user@example.com');
  await page.getByTestId('login-password-input').fill('not-a-real-password');

  await expect(page.getByTestId('login-submit-button')).toBeEnabled();
});

test('guest access to protected route redirects to login with next target', async ({ page }) => {
  await page.goto('/navigation', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login\?next=/, { timeout: 20000 });

  const current = new URL(page.url());
  expect(current.pathname).toBe('/login');
  expect(current.searchParams.get('next')).toBe('/navigation');
});

test('turnstile verify endpoint rejects missing token', async ({ request }) => {
  const response = await request.post('/api/turnstile/verify', {
    data: {},
    timeout: 30_000,
  });
  expect(response.status()).toBe(400);
  const payload = await response.json();
  expect(payload.ok).toBe(false);
});

test('security headers are present on login and navigation responses', async ({ request }) => {
  const loginResponse = await request.get('/login');
  expect(loginResponse.status()).toBe(200);
  expect(loginResponse.headers()['x-frame-options']).toBe('DENY');
  expect(loginResponse.headers()['x-content-type-options']).toBe('nosniff');
  expect(loginResponse.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(loginResponse.headers()['content-security-policy']).toContain("default-src 'self'");

  const navigationResponse = await request.get('/navigation');
  expect(navigationResponse.status()).toBe(200);
  expect(navigationResponse.headers()['x-frame-options']).toBe('DENY');
  expect(navigationResponse.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});
