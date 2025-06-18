#!/usr/bin/env node

/**
 * Upload static assets to Cloudflare R2 bucket for inventory management
 * Based on deployment requirements from true-docs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CLOUDFLARE_API_TOKEN = "TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf";
const CLOUDFLARE_ACCOUNT_ID = "68d0160c9915efebbbecfddfd48cddab";
const BUCKET_NAME = "inventory-management-production";
const BUILD_DIR = "./out";

// Ensure environment variables are set
process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
process.env.CLOUDFLARE_ACCOUNT_ID = CLOUDFLARE_ACCOUNT_ID;

console.log('🚀 Starting R2 asset upload for inventory management...');

// Function to get content type based on file extension
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

// Function to upload a single file
function uploadFile(localPath, remotePath) {
  const contentType = getContentType(localPath);
  
  try {
    console.log(`📤 Uploading: ${remotePath} (${contentType})`);
    
    execSync(
      `npx wrangler r2 object put ${BUCKET_NAME}/${remotePath} --file="${localPath}" --content-type="${contentType}"`,
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
  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run `pnpm build` first.');
    process.exit(1);
  }
  
  console.log(`📂 Uploading from ${BUILD_DIR} to bucket ${BUCKET_NAME}...`);
  
  // Upload all files
  const result = uploadDirectory(BUILD_DIR);
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${result.uploadCount} files`);
  console.log(`❌ Failed uploads: ${result.failCount} files`);
  
  if (result.failCount === 0) {
    console.log('\n🎉 All assets uploaded successfully!');
    console.log('🌐 Inventory management app is now live at: https://inventory.gangerdermatology.com');
  } else {
    console.log('\n⚠️  Some uploads failed. Check the errors above.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Upload process failed:', error.message);
  process.exit(1);
}