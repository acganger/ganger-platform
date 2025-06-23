const fs = require('fs');
const path = require('path');

const CLOUDFLARE_API_TOKEN = 'CNJuDfW4xVxdeNfcNToaqtwKjtqRdQLxF7DvcKuj';
const ACCOUNT_ID = '68d0160c9915efebbbecfddfd48cddab';
const BUCKET_NAME = 'ganger-eos-l10-assets';
const OUT_DIR = '../../apps/call-center-ops/out';

async function uploadToR2(filePath, key, contentType) {
  // Prefix with call-center-ops to avoid conflicts
  const prefixedKey = `call-center-ops/${key}`;
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${prefixedKey}`;
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`✓ Uploaded ${prefixedKey} (${contentType})`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to upload ${key}:`, error.message);
    return false;
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
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
    '.eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      files.push({
        filePath: fullPath,
        key: relativePath,
        contentType: getMimeType(fullPath)
      });
    }
  }
  
  return files;
}

async function main() {
  const outPath = path.resolve(__dirname, OUT_DIR);
  
  if (!fs.existsSync(outPath)) {
    console.error('❌ Build output directory not found:', outPath);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }

  console.log('📦 Starting Call Center Ops asset upload to R2...');
  console.log('📁 Source directory:', outPath);
  
  const files = getAllFiles(outPath);
  console.log(`📋 Found ${files.length} files to upload`);
  
  let successful = 0;
  let failed = 0;
  
  // Upload files in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const promises = batch.map(file => uploadToR2(file.filePath, file.key, file.contentType));
    const results = await Promise.all(promises);
    
    successful += results.filter(r => r).length;
    failed += results.filter(r => !r).length;
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${files.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All assets uploaded successfully!');
    console.log('🚀 Ready to deploy worker');
  } else {
    console.log('\n⚠️  Some uploads failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Upload failed:', error);
  process.exit(1);
});