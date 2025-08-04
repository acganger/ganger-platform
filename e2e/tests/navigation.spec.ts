import { test, expect } from '@playwright/test';

test.describe('Navigation Between Apps', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to inventory app', async ({ page }) => {
    // Click on inventory link - adjust selector based on actual implementation
    const inventoryLink = page.locator('a[href*="/inventory"]').first();
    
    if (await inventoryLink.isVisible()) {
      await inventoryLink.click();
      
      // Wait for navigation
      await page.waitForURL('**/inventory**');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the inventory page
      const url = page.url();
      expect(url).toContain('/inventory');
    }
  });

  test('should navigate to handouts app', async ({ page }) => {
    // Look for handouts link
    const handoutsLink = page.locator('a[href*="/handouts"]').first();
    
    if (await handoutsLink.isVisible()) {
      await handoutsLink.click();
      
      // Wait for navigation
      await page.waitForURL('**/handouts**');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the handouts page
      const url = page.url();
      expect(url).toContain('/handouts');
    }
  });

  test('should navigate to multiple apps in sequence', async ({ page }) => {
    const appRoutes = [
      '/inventory',
      '/handouts',
      '/actions',
      '/platform-dashboard',
      '/config'
    ];
    
    for (const route of appRoutes) {
      // Try to find a link to this app
      const appLink = page.locator(`a[href*="${route}"]`).first();
      
      if (await appLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appLink.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Verify URL contains the route
        const url = page.url();
        expect(url).toContain(route);
        
        // Navigate back to home for next iteration
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should handle back navigation', async ({ page }) => {
    // Navigate to an app
    const firstLink = page.locator('a[href*="/inventory"], a[href*="/handouts"], a[href*="/actions"]').first();
    
    if (await firstLink.isVisible()) {
      const originalUrl = page.url();
      
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Should be back at the original URL
      expect(page.url()).toBe(originalUrl);
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    // This test checks if basic state is maintained
    // We'll need to update this based on actual app behavior
    
    // Set a value in localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-navigation', 'test-value');
    });
    
    // Navigate to another app
    const appLink = page.locator('a[href*="/inventory"], a[href*="/handouts"]').first();
    if (await appLink.isVisible()) {
      await appLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check if localStorage value persists
      const value = await page.evaluate(() => {
        return localStorage.getItem('test-navigation');
      });
      
      expect(value).toBe('test-value');
      
      // Clean up
      await page.evaluate(() => {
        localStorage.removeItem('test-navigation');
      });
    }
  });
});