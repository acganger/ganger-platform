#!/usr/bin/env node

/**
 * Update the getInventoryApp function to serve from R2 bucket
 */

const fs = require('fs');

const staffRouterPath = '/mnt/q/Projects/ganger-platform/cloudflare-workers/staff-router.js';

// Read the current file
let content = fs.readFileSync(staffRouterPath, 'utf8');

// New inventory function that serves from R2
const newInventoryFunction = `async function getInventoryApp(request, env) {
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Remove /inventory prefix for R2 key lookup
  let r2Key = pathname.replace('/inventory', '');
  
  // Handle root inventory path
  if (r2Key === '' || r2Key === '/') {
    r2Key = 'index.html';
  }
  
  // Handle directory paths (add index.html)
  if (r2Key.endsWith('/')) {
    r2Key += 'index.html';
  }
  
  // Handle paths without extensions (Next.js routing)
  if (!r2Key.includes('.') && !r2Key.endsWith('/')) {
    r2Key += '.html';
  }
  
  // Remove leading slash for R2 key
  r2Key = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key;
  
  try {
    // Attempt to get file from R2
    const object = await env.INVENTORY_BUCKET.get(r2Key);
    
    if (!object) {
      // Try fallback to index.html for client-side routing
      const indexObject = await env.INVENTORY_BUCKET.get('index.html');
      if (indexObject) {
        return new Response(indexObject.body, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=86400',
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
          },
        });
      }
      
      // Return 404 if not found
      return new Response('Inventory page not found', { 
        status: 404,
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Determine content type
    const contentType = getContentType(r2Key);
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': getCacheControl(r2Key),
        'ETag': object.etag,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
    });
    
  } catch (error) {
    console.error('R2 fetch error for inventory:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

function getContentType(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  return types[ext || ''] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}`;

// Find the current getInventoryApp function and replace it
const functionStart = content.indexOf('function getInventoryApp()');
const functionEnd = content.indexOf('\n}', functionStart) + 2;

if (functionStart === -1) {
  console.error('❌ Could not find getInventoryApp function');
  process.exit(1);
}

// Replace the function
const beforeFunction = content.substring(0, functionStart);
const afterFunction = content.substring(functionEnd);
const newContent = beforeFunction + newInventoryFunction + afterFunction;

// Update the main request handler to pass env parameter
const updatedContent = newContent.replace(
  'return getInventoryApp();',
  'return getInventoryApp(request, env);'
);

// Write the updated file
fs.writeFileSync(staffRouterPath, updatedContent);

console.log('✅ Updated getInventoryApp function to serve from R2 bucket');
console.log('✅ Updated request handler to pass env parameter');
console.log('📁 File updated:', staffRouterPath);