#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration for screenshots
const screenshots = [
  {
    name: '2025-06-13-deployment-001-homepage-desktop',
    url: 'https://staff.gangerdermatology.com/',
    viewport: { width: 1920, height: 1080 },
    fullPage: true
  },
  {
    name: '2025-06-13-deployment-001-homepage-mobile',
    url: 'https://staff.gangerdermatology.com/',
    viewport: { width: 375, height: 667 },
    fullPage: true
  },
  {
    name: '2025-06-13-deployment-001-status-desktop',
    url: 'https://staff.gangerdermatology.com/status',
    viewport: { width: 1920, height: 1080 },
    fullPage: true
  },
  {
    name: '2025-06-13-deployment-001-meds-desktop',
    url: 'https://staff.gangerdermatology.com/meds',
    viewport: { width: 1920, height: 1080 },
    fullPage: true
  },
  {
    name: '2025-06-13-deployment-001-inventory-comingsoon',
    url: 'https://staff.gangerdermatology.com/inventory',
    viewport: { width: 1920, height: 1080 },
    fullPage: true
  }
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  // Ensure deployments directory exists
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  console.log('🚀 Starting screenshot capture for deployment verification...\n');

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.name}`);
      console.log(`   URL: ${screenshot.url}`);
      console.log(`   Viewport: ${screenshot.viewport.width}x${screenshot.viewport.height}`);

      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport(screenshot.viewport);
      
      // Navigate to URL
      await page.goto(screenshot.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for page to fully load
      await page.waitForTimeout(3000);
      
      // Take screenshot
      const filePath = path.join(deploymentsDir, `${screenshot.name}.png`);
      await page.screenshot({
        path: filePath,
        fullPage: screenshot.fullPage,
        type: 'png'
      });
      
      console.log(`   ✅ Saved: ${filePath}\n`);
      
      await page.close();
    } catch (error) {
      console.error(`   ❌ Error capturing ${screenshot.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('🎉 Screenshot capture complete!');
}

// Run the script
captureScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});