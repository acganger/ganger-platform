const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'ganger-checkin-kiosk-production';
const OUT_DIR = './out';

// Set the API token
process.env.CLOUDFLARE_API_TOKEN = 'TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf';

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

function uploadFile(localPath, r2Key) {
  const contentType = getContentType(localPath);
  const cmd = `npx wrangler r2 object put ${BUCKET_NAME}/${r2Key} --file=${localPath} --content-type="${contentType}" --remote`;
  
  try {
    console.log(`Uploading: ${r2Key}`);
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error(`Failed to upload ${r2Key}:`, error.message);
    return false;
  }
}

function getAllFiles(dir, basePath = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      files.push({ fullPath, relativePath: relativePath.replace(/\\/g, '/') });
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Starting R2 upload for Check-in Kiosk...');
  
  if (!fs.existsSync(OUT_DIR)) {
    console.error('❌ Out directory not found! Run npm run build first.');
    process.exit(1);
  }
  
  const files = getAllFiles(OUT_DIR);
  console.log(`📁 Found ${files.length} files to upload`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { fullPath, relativePath } of files) {
    if (uploadFile(fullPath, relativePath)) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n✅ Upload complete!`);
  console.log(`   Success: ${successCount} files`);
  console.log(`   Failed: ${failCount} files`);
  
  // Verify index.html
  console.log('\n🔍 Verifying deployment...');
  try {
    execSync(`npx wrangler r2 object get ${BUCKET_NAME}/index.html --pipe --remote > /dev/null 2>&1`);
    console.log('✅ Verification successful!');
  } catch (error) {
    console.log('❌ Verification failed!');
  }
}

main().catch(console.error);