/**
 * Service Worker for DogTale Daily
 * Handles push notifications and offline caching
 */

const CACHE_NAME = 'dogtale-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests (should always be fresh)
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('supabase') ||
      event.request.url.includes('dog.ceo') ||
      event.request.url.includes('thecatapi.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'DogTale Daily',
    body: 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'dogtale-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'dogtale-notification',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on notification type
  if (data.type) {
    switch (data.type) {
      case 'vaccination_due':
      case 'medication_reminder':
      case 'vet_appointment':
        targetUrl = '/?modal=health';
        break;
      case 'friend_request':
      case 'friend_accepted':
        targetUrl = '/?modal=social&tab=friends';
        break;
      case 'activity_reaction':
      case 'activity_comment':
        targetUrl = '/?modal=social&tab=activity';
        break;
      case 'quest_complete':
      case 'level_up':
        targetUrl = '/?modal=social&tab=gameplay';
        break;
      case 'virtual_pet_needs':
        targetUrl = '/?modal=pet';
        break;
      default:
        targetUrl = data.url || '/';
    }
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Default behavior - open the app
        break;
      case 'dismiss':
        // Just close the notification
        return;
      default:
        // Custom action handling
        if (data.actionUrls && data.actionUrls[event.action]) {
          targetUrl = data.actionUrls[event.action];
        }
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            // Navigate existing window
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
              targetUrl: targetUrl,
            });
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);

  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismiss) {
    // Could send analytics here
  }
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CLEAR_CACHE':
        caches.delete(CACHE_NAME).then(() => {
          console.log('[SW] Cache cleared');
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        });
        break;
      case 'GET_CACHE_STATUS':
        caches.open(CACHE_NAME).then((cache) => {
          cache.keys().then((keys) => {
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({
                cacheSize: keys.length,
                cacheName: CACHE_NAME
              });
            }
          });
        });
        break;
    }
  }
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-journal') {
    event.waitUntil(syncJournalEntries());
  } else if (event.tag === 'sync-health-records') {
    event.waitUntil(syncHealthRecords());
  }
});

// Placeholder sync functions - to be implemented with IndexedDB
async function syncJournalEntries() {
  console.log('[SW] Syncing journal entries...');
  // TODO: Implement offline journal sync
}

async function syncHealthRecords() {
  console.log('[SW] Syncing health records...');
  // TODO: Implement offline health records sync
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  console.log('[SW] Checking reminders...');
  // TODO: Implement reminder checking
}
