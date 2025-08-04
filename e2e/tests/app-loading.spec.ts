import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the ganger-staff home page', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to be loaded
    await page.waitForLoadState('networkidle');
    
    // Check if the page title contains 'Ganger'
    await expect(page).toHaveTitle(/Ganger/i);
    
    // Check if there's a main element on the page
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for common navigation elements
    // We'll need to update these selectors based on the actual HTML structure
    const navElement = page.locator('nav, [role="navigation"]').first();
    await expect(navElement).toBeVisible();
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    const desktopMain = page.locator('main');
    await expect(desktopMain).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Give time for responsive changes
    await expect(desktopMain).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Give time for responsive changes
    await expect(desktopMain).toBeVisible();
  });
});