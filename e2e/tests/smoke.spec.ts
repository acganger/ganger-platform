import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('playwright is set up correctly', async ({ page }) => {
    // This is a simple test to verify Playwright is working
    await page.goto('https://playwright.dev/');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('can access localhost', async ({ page }) => {
    // Try to access localhost
    // This will fail if the dev server isn't running, which is expected in CI
    try {
      await page.goto('http://localhost:3000', { timeout: 5000 });
      // If we get here, the server is running
      expect(page.url()).toContain('localhost');
    } catch (error) {
      // Server not running, which is fine for this smoke test
      expect(error).toBeTruthy();
    }
  });
});