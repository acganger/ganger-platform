#!/usr/bin/env node

/**
 * Upload assets to REMOTE R2 bucket (not local)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLOUDFLARE_API_TOKEN = "TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf";
const CLOUDFLARE_ACCOUNT_ID = "68d0160c9915efebbbecfddfd48cddab";
const BUCKET_NAME = "inventory-management-production";
const BUILD_DIR = "./out";

// Set environment
process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
process.env.CLOUDFLARE_ACCOUNT_ID = CLOUDFLARE_ACCOUNT_ID;

console.log('🚀 Starting REMOTE R2 asset upload for inventory management...');

// Function to get content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Function to upload a single file with --remote flag
function uploadFile(localPath, remotePath) {
  const contentType = getContentType(localPath);
  
  try {
    console.log(`📤 Uploading: ${remotePath} (${contentType})`);
    
    execSync(
      `npx wrangler r2 object put ${BUCKET_NAME}/${remotePath} --file="${localPath}" --content-type="${contentType}" --remote`,
      { 
        stdio: 'pipe',
        env: { ...process.env, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID }
      }
    );
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${remotePath}:`, error.message);
    return false;
  }
}

// Function to recursively upload directory
function uploadDirectory(dir, baseDir = '') {
  const items = fs.readdirSync(dir);
  let uploadCount = 0;
  let failCount = 0;
  
  for (const item of items) {
    const localPath = path.join(dir, item);
    const remotePath = baseDir ? `${baseDir}/${item}` : item;
    
    if (fs.statSync(localPath).isDirectory()) {
      // Recursively upload subdirectory
      const result = uploadDirectory(localPath, remotePath);
      uploadCount += result.uploadCount;
      failCount += result.failCount;
    } else {
      // Upload file
      if (uploadFile(localPath, remotePath)) {
        uploadCount++;
      } else {
        failCount++;
      }
    }
  }
  
  return { uploadCount, failCount };
}

// Main upload process
try {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run `pnpm build` first.');
    process.exit(1);
  }
  
  console.log(`📂 Uploading from ${BUILD_DIR} to REMOTE bucket ${BUCKET_NAME}...`);
  
  // Upload all files with --remote flag
  const result = uploadDirectory(BUILD_DIR);
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${result.uploadCount} files`);
  console.log(`❌ Failed uploads: ${result.failCount} files`);
  
  if (result.failCount === 0) {
    console.log('\n🎉 All assets uploaded successfully to REMOTE R2!');
    
    // Verify the key file exists
    try {
      console.log('\n🔍 Verifying index.html...');
      execSync(
        `npx wrangler r2 object get ${BUCKET_NAME}/index.html --remote`,
        { 
          stdio: 'pipe',
          env: { ...process.env, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID }
        }
      );
      console.log('✅ index.html verified in remote R2!');
    } catch (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    }
    
  } else {
    console.log('\n⚠️  Some uploads failed. Check the errors above.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Upload process failed:', error.message);
  process.exit(1);
}