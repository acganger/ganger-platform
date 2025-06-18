#!/bin/bash

API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
BUCKET="config-dashboard-production"

echo "🚀 Uploading all files to production R2 bucket..."

cd out

# Upload main files
echo "📄 Uploading main HTML files..."
wrangler r2 object put $BUCKET/index.html --file=index.html
wrangler r2 object put $BUCKET/404.html --file=404.html

# Upload 404 directory
echo "📁 Uploading 404 directory..."
wrangler r2 object put $BUCKET/404/index.html --file=404/index.html

# Upload _next directory structure
echo "⚛️ Uploading Next.js assets..."

# CSS files
wrangler r2 object put $BUCKET/_next/static/css/ef46db3751d8e999.css --file=_next/static/css/ef46db3751d8e999.css

# JS chunks
wrangler r2 object put $BUCKET/_next/static/chunks/framework-e0f347a11a70369e.js --file=_next/static/chunks/framework-e0f347a11a70369e.js
wrangler r2 object put $BUCKET/_next/static/chunks/main-a99b11475da7a0fd.js --file=_next/static/chunks/main-a99b11475da7a0fd.js
wrangler r2 object put $BUCKET/_next/static/chunks/polyfills-42372ed130431b0a.js --file=_next/static/chunks/polyfills-42372ed130431b0a.js
wrangler r2 object put $BUCKET/_next/static/chunks/webpack-59c5c889f52620d6.js --file=_next/static/chunks/webpack-59c5c889f52620d6.js

# Pages
wrangler r2 object put $BUCKET/_next/static/chunks/pages/_app-8cb981d222ccebf5.js --file=_next/static/chunks/pages/_app-8cb981d222ccebf5.js
wrangler r2 object put $BUCKET/_next/static/chunks/pages/_error-c00057bbae1268e0.js --file=_next/static/chunks/pages/_error-c00057bbae1268e0.js
wrangler r2 object put $BUCKET/_next/static/chunks/pages/index-47523930f99c3b3c.js --file=_next/static/chunks/pages/index-47523930f99c3b3c.js

# Build manifests
wrangler r2 object put $BUCKET/_next/static/SeJZ1anBeHzFRcyaxPMVw/_buildManifest.js --file=_next/static/SeJZ1anBeHzFRcyaxPMVw/_buildManifest.js
wrangler r2 object put $BUCKET/_next/static/SeJZ1anBeHzFRcyaxPMVw/_ssgManifest.js --file=_next/static/SeJZ1anBeHzFRcyaxPMVw/_ssgManifest.js

cd ..

echo "✅ All files uploaded to production!"
echo "🌐 Site should be available at: https://config.gangerdermatology.com"