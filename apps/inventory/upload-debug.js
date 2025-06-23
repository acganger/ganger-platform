#!/usr/bin/env node

/**
 * Debug upload to check what's happening with R2
 */

const { execSync } = require('child_process');

const CLOUDFLARE_API_TOKEN = "TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf";
const CLOUDFLARE_ACCOUNT_ID = "68d0160c9915efebbbecfddfd48cddab";
const BUCKET_NAME = "inventory-management-production";

// Set environment
process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
process.env.CLOUDFLARE_ACCOUNT_ID = CLOUDFLARE_ACCOUNT_ID;

console.log('🔍 Debug: Testing R2 upload for index.html...');

try {
  // Test uploading just the index.html file
  console.log('📤 Uploading index.html...');
  
  const result = execSync(
    `npx wrangler r2 object put ${BUCKET_NAME}/index.html --file="./out/index.html" --content-type="text/html"`,
    { 
      stdio: 'pipe',
      env: { ...process.env, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID },
      encoding: 'utf8'
    }
  );
  
  console.log('✅ Upload result:', result);
  
  // Verify it was uploaded
  console.log('🔍 Verifying upload...');
  
  const verify = execSync(
    `npx wrangler r2 object get ${BUCKET_NAME}/index.html --remote`,
    { 
      stdio: 'pipe',
      env: { ...process.env, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID },
      encoding: 'utf8'
    }
  );
  
  console.log('✅ File verified in R2:', verify.length, 'bytes');
  
} catch (error) {
  console.error('❌ Upload failed:', error.message);
  console.error('❌ Error details:', error.stdout || error.stderr);
}