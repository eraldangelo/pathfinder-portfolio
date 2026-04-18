import { expect, test } from '@playwright/test';

test('dashboard PDF download wiring: spinner, state reset, and repeat download', async ({ page }) => {
  await page.goto('/smoke/dashboard-download');

  await expect(page.getByTestId('smoke-dashboard-download-page')).toBeVisible();
  await expect(page.getByTestId('smoke-dashboard-status')).toHaveText('idle');
  await expect(page.getByTestId('smoke-dashboard-pdf-runs')).toHaveText('0');

  await page.getByTestId('dashboard-download-trigger').click();
  await expect(page.getByTestId('dashboard-download-menu')).toBeVisible();

  const firstDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('dashboard-download-pdf').click();

  await expect(page.getByTestId('dashboard-download-spinner')).toBeVisible();
  await expect(page.getByTestId('dashboard-download-trigger')).toContainText('Downloading PDF...');
  const firstDownload = await firstDownloadPromise;

  expect(firstDownload.suggestedFilename().toLowerCase()).toContain('.pdf');
  await expect(page.getByTestId('smoke-dashboard-status')).toHaveText('idle', { timeout: 20000 });
  await expect(page.getByTestId('smoke-dashboard-pdf-runs')).toHaveText('1');
  await expect(page.getByTestId('smoke-dashboard-last-file')).toHaveText('pdf');

  await page.getByTestId('dashboard-download-trigger').click();
  await expect(page.getByTestId('dashboard-download-menu')).toBeVisible();
  const secondDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('dashboard-download-pdf').click();
  const secondDownload = await secondDownloadPromise;

  expect(secondDownload.suggestedFilename().toLowerCase()).toContain('.pdf');
  await expect(page.getByTestId('smoke-dashboard-status')).toHaveText('idle', { timeout: 20000 });
  await expect(page.getByTestId('smoke-dashboard-pdf-runs')).toHaveText('2');
  await expect(page.getByTestId('smoke-dashboard-last-duration')).not.toHaveText('0');
});

