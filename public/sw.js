const CACHE_NAME = 'healthcrm-v2';
const DATA_CACHE_NAME = 'healthcrm-data-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

// IndexedDB for offline data storage
const DB_NAME = 'healthcrm-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores for offline data
      if (!db.objectStoreNames.contains('pacientes')) {
        db.createObjectStore('pacientes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('llamadas')) {
        db.createObjectStore('llamadas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('visitas')) {
        db.createObjectStore('visitas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('personal')) {
        db.createObjectStore('personal', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function saveToIndexedDB(storeName, data) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  if (Array.isArray(data)) {
    data.forEach(item => store.put(item));
  } else {
    store.put(data);
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFromIndexedDB(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingAction(action) {
  const db = await openDB();
  const tx = db.transaction('pending-actions', 'readwrite');
  const store = tx.objectStore('pending-actions');
  store.add({
    ...action,
    timestamp: Date.now()
  });
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with offline fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Handle Supabase API requests with offline support
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    event.respondWith(handleSupabaseRequest(event.request));
    return;
  }
  
  // Skip other API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Handle static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Handle Supabase requests with offline support
async function handleSupabaseRequest(request) {
  const url = new URL(request.url);
  const tableName = extractTableName(url.pathname);
  
  try {
    const response = await fetch(request);
    
    if (response.ok && tableName) {
      const data = await response.clone().json();
      
      // Cache successful responses in IndexedDB
      if (Array.isArray(data) && data.length > 0) {
        await saveToIndexedDB(tableName, data);
      }
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, trying offline cache for:', tableName);
    
    // Return cached data if offline
    if (tableName) {
      try {
        const cachedData = await getFromIndexedDB(tableName);
        if (cachedData && cachedData.length > 0) {
          return new Response(JSON.stringify(cachedData), {
            headers: {
              'Content-Type': 'application/json',
              'X-Offline-Response': 'true'
            }
          });
        }
      } catch (dbError) {
        console.error('IndexedDB error:', dbError);
      }
    }
    
    throw error;
  }
}

function extractTableName(pathname) {
  const tables = ['pacientes', 'registro_llamadas', 'control_visitas', 'personal_salud'];
  for (const table of tables) {
    if (pathname.includes(table)) {
      // Map to our IndexedDB store names
      if (table === 'registro_llamadas') return 'llamadas';
      if (table === 'control_visitas') return 'visitas';
      if (table === 'personal_salud') return 'personal';
      return table;
    }
  }
  return null;
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending-actions', 'readonly');
    const store = tx.objectStore('pending-actions');
    
    const actions = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: JSON.stringify(action.body)
        });
        
        // Remove synced action
        const deleteTx = db.transaction('pending-actions', 'readwrite');
        deleteTx.objectStore('pending-actions').delete(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
    
    // Notify clients of sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'HealthCRM', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  if (action === 'confirm') {
    // Handle confirm action
    event.waitUntil(
      clients.openWindow(notificationData.confirmUrl || notificationData.url)
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    event.waitUntil(
      clients.openWindow(notificationData.url)
    );
  }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_DATA') {
    const { storeName, data } = event.data;
    saveToIndexedDB(storeName, data);
  }
  
  if (event.data.type === 'SAVE_PENDING_ACTION') {
    savePendingAction(event.data.action);
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});