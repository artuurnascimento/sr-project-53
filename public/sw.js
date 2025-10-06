// Service Worker for PWA functionality
const CACHE_NAME = 'portal-ponto-v1';
const OFFLINE_URL = '/portal';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/portal',
  '/portal/home',
  '/portal/historico',
  '/portal/justificativas',
  '/manifest.json',
  '/logo-sirius.png'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle requests to the portal
  if (!event.request.url.includes('/portal')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If request is successful, update cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // If fetch fails, try to serve from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, serve offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for offline punch data
self.addEventListener('sync', (event) => {
  if (event.tag === 'punch-sync') {
    event.waitUntil(syncPunchData());
  }
});

// Sync offline punch data when connection is restored
async function syncPunchData() {
  try {
    // Get offline punch data from IndexedDB
    const offlinePunches = await getOfflinePunches();
    
    for (const punch of offlinePunches) {
      try {
        // Send punch to server
        const response = await fetch('/api/punch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...punch,
            source: 'offline_sync'
          })
        });

        if (response.ok) {
          // Remove from offline storage
          await removeOfflinePunch(punch.id);
        }
      } catch (error) {
        console.error('Failed to sync punch:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helpers (placeholder - implement as needed)
async function getOfflinePunches() {
  // TODO: Implement IndexedDB read
  return [];
}

async function removeOfflinePunch(id) {
  // TODO: Implement IndexedDB delete
}