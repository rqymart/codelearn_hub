const CACHE_NAME = 'codelearn-hub-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/tutorials.html',
  '/bookmarks.html',
  '/css/index.css',
  '/css/tutorials.css',
  '/css/bookmarks.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/editor.js',
  '/js/progress.js',
  '/js/bookmarks.js',
  '/js/tutorials.js',
  '/assets/logo.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/logo.png',
    badge: '/assets/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Tutorial',
        icon: '/assets/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CodeLearn Hub', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/tutorials.html')
    );
  }
});

// Helper function for background sync
async function syncProgress() {
  try {
    const db = await openDB();
    const offlineProgress = await db.getAll('offlineProgress');
    
    for (const progress of offlineProgress) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(progress)
        });
        
        await db.delete('offlineProgress', progress.id);
      } catch (error) {
        console.error('Failed to sync progress:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CodeLearnHub', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineProgress')) {
        db.createObjectStore('offlineProgress', { keyPath: 'id' });
      }
    };
  });
} 