const puppeteer = require('puppeteer');

async function testCompassTemplate() {
  console.log('🚀 Starting Compass template verification...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test URL 1: staff.gangerdermatology.com/l10/compass
    console.log('\n📱 Testing: https://staff.gangerdermatology.com/l10/compass');
    
    await page.goto('https://staff.gangerdermatology.com/l10/compass', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check for Compass template elements
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    // Check for specific Compass template elements
    const compassElements = await page.evaluate(() => {
      const results = {};
      
      // Check for EOS L10 Platform heading
      results.hasL10Platform = !!document.querySelector('h1:contains("EOS L10 Platform")') || 
                              !!Array.from(document.querySelectorAll('h1')).find(h => h.textContent.includes('EOS L10'));
      
      // Check for scorecard section
      results.hasScorecard = !!document.querySelector('h2:contains("Scorecard")') ||
                            !!Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Scorecard'));
      
      // Check for sidebar navigation
      results.hasSidebar = !!document.querySelector('nav') || 
                          !!document.querySelector('.lg\\:w-72') ||
                          !!document.querySelector('[class*="sidebar"]');
      
      // Check for performance metrics
      results.hasMetrics = !!document.querySelector(':contains("Revenue")') ||
                          !!Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Revenue'));
      
      // Check for Tailwind classes
      results.hasTailwind = !!document.querySelector('[class*="bg-gradient"]') ||
                           !!document.querySelector('[class*="rounded-lg"]');
      
      // Check for Feather icons
      results.hasFeatherIcons = !!document.querySelector('[data-feather]');
      
      // Get main heading text
      const mainHeading = document.querySelector('h1');
      results.mainHeading = mainHeading ? mainHeading.textContent.trim() : '';
      
      return results;
    });
    
    console.log('🔍 Compass Template Elements Check:');
    console.log(`   ✅ Has L10 Platform heading: ${compassElements.hasL10Platform}`);
    console.log(`   ✅ Has Scorecard section: ${compassElements.hasScorecard}`);
    console.log(`   ✅ Has sidebar navigation: ${compassElements.hasSidebar}`);
    console.log(`   ✅ Has performance metrics: ${compassElements.hasMetrics}`);
    console.log(`   ✅ Has Tailwind styling: ${compassElements.hasTailwind}`);
    console.log(`   ✅ Has Feather icons: ${compassElements.hasFeatherIcons}`);
    console.log(`   📝 Main heading: "${compassElements.mainHeading}"`);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/mnt/q/Projects/ganger-platform/testing/staff-l10-compass.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: staff-l10-compass.png');
    
    // Check if this looks like the Compass template vs basic grid
    const isCompassTemplate = compassElements.hasScorecard && compassElements.hasSidebar && compassElements.hasMetrics;
    const isBasicGrid = await page.evaluate(() => {
      return !!document.querySelector('[class*="grid"]') && 
             !!Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('17 applications')) ||
             !!Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Staff Management Portal'));
    });
    
    console.log(`\n🎯 Template Analysis:`);
    console.log(`   ${isCompassTemplate ? '✅' : '❌'} Displays Compass Template`);
    console.log(`   ${isBasicGrid ? '❌' : '✅'} NOT Basic Grid Layout`);
    
    if (isCompassTemplate) {
      console.log('🎉 SUCCESS: Compass template is properly displayed!');
    } else if (isBasicGrid) {
      console.log('⚠️  WARNING: Still showing basic grid layout');
    } else {
      console.log('❓ UNKNOWN: Layout type unclear');
    }
    
    // Test mobile responsiveness
    console.log('\n📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);
    
    const mobileElements = await page.evaluate(() => {
      const sidebar = document.querySelector('#mobile-sidebar');
      const openButton = document.querySelector('#open-sidebar');
      return {
        hasMobileSidebar: !!sidebar,
        hasOpenButton: !!openButton,
        sidebarHidden: sidebar ? sidebar.classList.contains('sidebar-hidden') : false
      };
    });
    
    console.log(`   ✅ Has mobile sidebar: ${mobileElements.hasMobileSidebar}`);
    console.log(`   ✅ Has menu button: ${mobileElements.hasOpenButton}`);
    console.log(`   ✅ Sidebar initially hidden: ${mobileElements.sidebarHidden}`);
    
    await page.screenshot({ 
      path: '/mnt/q/Projects/ganger-platform/testing/staff-l10-compass-mobile.png',
      fullPage: true 
    });
    console.log('📸 Mobile screenshot saved: staff-l10-compass-mobile.png');
    
  } catch (error) {
    console.error('❌ Error testing Compass template:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testCompassTemplate().then(() => {
  console.log('\n✅ Compass template verification complete!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});