import { Page, expect } from '@playwright/test';

/**
 * Wait for the page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if an element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Check for console errors and warnings
 */
export function setupConsoleListener(page: Page) {
  const consoleMessages: { type: string; text: string }[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    }
  });
  
  return consoleMessages;
}

/**
 * Wait for navigation to complete
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await waitForPageLoad(page);
}

/**
 * Check if the page has any accessibility issues
 * (Basic check - for more comprehensive testing, use @axe-core/playwright)
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for page title
  const title = await page.title();
  expect(title).toBeTruthy();
  
  // Check for main landmark
  const main = page.locator('main');
  await expect(main).toBeVisible();
  
  // Check for proper heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThan(0);
  
  // Check for alt text on images
  const images = page.locator('img');
  const imageCount = await images.count();
  
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    // Images should have alt text (even if empty for decorative images)
    expect(alt).toBeDefined();
  }
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Get all links on the page
 */
export async function getAllLinks(page: Page): Promise<string[]> {
  const links = await page.locator('a[href]').all();
  const hrefs: string[] = [];
  
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href) {
      hrefs.push(href);
    }
  }
  
  return hrefs;
}

/**
 * Check if page is responsive
 */
export async function checkResponsiveness(page: Page) {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 768, height: 1024, name: 'tablet-portrait' },
    { width: 375, height: 667, name: 'mobile' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500); // Wait for responsive changes
    
    // Check that main content is still visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  }
}