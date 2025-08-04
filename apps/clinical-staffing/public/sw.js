// Service Worker for Ganger Clinical Staffing PWA
const CACHE_NAME = 'ganger-clinical-staffing-v1';
const STATIC_CACHE_NAME = 'ganger-clinical-staffing-static-v1';
const DYNAMIC_CACHE_NAME = 'ganger-clinical-staffing-dynamic-v1';
const API_CACHE_NAME = 'ganger-clinical-staffing-api-v1';

// Base path for the clinical staffing app
const BASE_PATH = '/clinical-staffing';

// URLs to cache on install
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/staff-assignments`,
  `${BASE_PATH}/schedule-builder`,
  `${BASE_PATH}/analytics`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/offline.html`,
  // Add CSS and JS files dynamically built by Next.js
];

// API endpoints to cache for offline access
const API_ENDPOINTS = [
  `${BASE_PATH}/api/providers`,
  `${BASE_PATH}/api/staff-members`,
  `${BASE_PATH}/api/staff-schedules`,
  `${BASE_PATH}/api/locations`,
  `${BASE_PATH}/api/health`
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Clinical Staffing service worker...');
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
  console.log('[SW] Activating Clinical Staffing service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName.startsWith('ganger-clinical-staffing-')) {
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
    }).catch(() => {
      // Silently fail background update
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
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', new Date().toISOString());
      
      const body = await cachedResponse.blob();
      return new Response(body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // For API requests, return a custom offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          offline: true, 
          message: 'You are offline. Showing cached data.',
          cached: true,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'X-From-Cache': 'true'
          },
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

// Handle background sync for offline schedule changes
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-schedule-updates') {
    event.waitUntil(syncScheduleUpdates());
  } else if (event.tag === 'sync-availability-updates') {
    event.waitUntil(syncAvailabilityUpdates());
  }
});

// Sync offline schedule updates
async function syncScheduleUpdates() {
  try {
    // Get pending updates from IndexedDB
    const pendingUpdates = await getPendingScheduleUpdates();
    
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
          
          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              updateId: update.id,
              data: update
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync schedule update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline availability updates
async function syncAvailabilityUpdates() {
  try {
    const pendingUpdates = await getPendingAvailabilityUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: JSON.stringify(update.body)
        });
        
        if (response.ok) {
          await removePendingUpdate(update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync availability update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Availability sync failed:', error);
  }
}

// IndexedDB helpers for offline sync
async function getPendingScheduleUpdates() {
  return getPendingUpdates('schedule_updates');
}

async function getPendingAvailabilityUpdates() {
  return getPendingUpdates('availability_updates');
}

async function getPendingUpdates(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClinicalStaffingDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removePendingUpdate(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClinicalStaffingDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['schedule_updates', 'availability_updates'], 'readwrite');
      
      // Try to delete from both stores
      ['schedule_updates', 'availability_updates'].forEach(storeName => {
        try {
          const store = transaction.objectStore(storeName);
          store.delete(id);
        } catch (e) {
          // Store might not exist, ignore
        }
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Handle push notifications for schedule changes
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Schedule update available',
    icon: `${BASE_PATH}/icon.svg`,
    badge: `${BASE_PATH}/icon.svg`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Schedule',
        icon: `${BASE_PATH}/icon.svg`
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Clinical Staffing Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(`${BASE_PATH}/`)
    );
  }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync for keeping schedules fresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-schedules') {
    event.waitUntil(refreshScheduleCache());
  }
});

// Refresh schedule cache
async function refreshScheduleCache() {
  const cache = await caches.open(API_CACHE_NAME);
  
  // Refresh critical endpoints
  const endpoints = [
    `${BASE_PATH}/api/staff-schedules`,
    `${BASE_PATH}/api/providers`,
    `${BASE_PATH}/api/staff-members`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        await cache.put(endpoint, response);
      }
    } catch (error) {
      console.error(`[SW] Failed to refresh ${endpoint}:`, error);
    }
  }
}