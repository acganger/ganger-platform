// Service Worker for Ganger Inventory PWA
const CACHE_NAME = 'ganger-inventory-v1';
const STATIC_CACHE_NAME = 'ganger-inventory-static-v1';
const DYNAMIC_CACHE_NAME = 'ganger-inventory-dynamic-v1';
const API_CACHE_NAME = 'ganger-inventory-api-v1';

// Base path for the inventory app
const BASE_PATH = '/inventory';

// URLs to cache on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/dashboard`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/offline.html`,
  // Add CSS and JS files dynamically built by Next.js
];

// API endpoints to cache
const API_ENDPOINTS = [
  `${BASE_PATH}/api/items`,
  `${BASE_PATH}/api/stats`,
  `${BASE_PATH}/api/health`
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith(`${BASE_PATH}/api/`)) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE_NAME)
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE_NAME)
    );
    return;
  }

  // Handle everything else with network-first strategy
  event.respondWith(
    networkFirstStrategy(request, DYNAMIC_CACHE_NAME)
  );
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
    });
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    // Return offline page if available
    return caches.match(`${BASE_PATH}/offline.html`);
  }
}

// Network-first strategy (for API and dynamic content)
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For API requests, return a custom offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          offline: true, 
          message: 'You are offline. Data may be outdated.',
          cached: true 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Return offline page for other requests
    return caches.match(`${BASE_PATH}/offline.html`);
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.startsWith('/_next/static/');
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-inventory-updates') {
    event.waitUntil(syncInventoryUpdates());
  }
});

// Sync offline inventory updates
async function syncInventoryUpdates() {
  try {
    // Get pending updates from IndexedDB
    const pendingUpdates = await getPendingUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: JSON.stringify(update.body)
        });
        
        if (response.ok) {
          // Remove from pending updates
          await removePendingUpdate(update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers for offline sync
async function getPendingUpdates() {
  // This would be implemented with IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingUpdate(id) {
  // This would be implemented with IndexedDB
  return;
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New inventory alert',
    icon: `${BASE_PATH}/icon.svg`,
    badge: `${BASE_PATH}/icon.svg`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Ganger Inventory', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(`${BASE_PATH}/dashboard`)
  );
});