#!/usr/bin/env node

/**
 * Upload Inventory static assets to R2 bucket
 */

const fs = require('fs');
const path = require('path');

// Function to recursively get all files
function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({
        path: fullPath,
        key: relativePath.replace(/\\/g, '/') // Convert Windows paths to forward slashes
      });
    }
  }
  
  return files;
}

// Function to get content type based on file extension
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
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
    '.eot': 'application/vnd.ms-fontobject',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.webp': 'image/webp'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadToR2() {
  try {
    const appsDir = path.join(__dirname, '../../apps/inventory/out');
    
    if (!fs.existsSync(appsDir)) {
      console.error('❌ Build output not found. Please run "npm run build" first.');
      console.error(`   Expected: ${appsDir}`);
      process.exit(1);
    }

    console.log('🚀 Starting upload to R2 bucket...');
    console.log(`📁 Source: ${appsDir}`);
    
    const files = getAllFiles(appsDir);
    console.log(`📄 Found ${files.length} files to upload`);

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.path);
        const contentType = getContentType(file.path);
        
        // Use wrangler to upload each file to R2
        const { execSync } = require('child_process');
        
        // Create a temporary file with content for wrangler to upload
        const tempFile = `/tmp/r2-upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        fs.writeFileSync(tempFile, content);
        
        try {
          const cmd = `npx wrangler r2 object put ganger-inventory-assets/${file.key} --file="${tempFile}" --content-type="${contentType}" --remote`;
          execSync(cmd, { 
            stdio: 'pipe',
            env: { 
              ...process.env, 
              CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
              CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID 
            }
          });
          
          console.log(`✅ ${file.key} (${contentType})`);
          uploaded++;
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${file.key}:`, uploadError.message);
          failed++;
        } finally {
          // Clean up temp file
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.key}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`✅ Uploaded: ${uploaded} files`);
    console.log(`❌ Failed: ${failed} files`);
    console.log(`📁 Total: ${files.length} files`);
    
    if (failed === 0) {
      console.log('\n🎉 All files uploaded successfully!');
    } else {
      console.log(`\n⚠️  ${failed} files failed to upload`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadToR2();