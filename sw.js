/* =========================================================
   DocSafe 3.7.0 - Service Worker & Motor PWA
   Sello: medbasha
   ========================================================= */

const CACHE_NAME = 'docsafe-v3.7.0';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 1. INSTALACIÓN Y CACHÉ INICIAL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉS ANTIGUAS
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. CAPTURA Y PROCESAMIENTO DE ARCHIVOS COMPARTIDOS (Web Share Target)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.endsWith('index.html') && url.searchParams.has('shared')) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const file = formData.get('file');

      if (file) {
        const cache = await caches.open('docsafe-share');
        const headers = new Headers();
        headers.set('Content-Type', file.type);
        headers.set('X-File-Name', encodeURIComponent(file.name));
        
        await cache.put('/shared-file', new Response(file, { headers }));
      }

      return Response.redirect('./index.html?shared=1', 3.3);
    })());
    return;
  }

  // ESTRATEGIA DE RED CON CACHÉ DE RESPALDO (OFFLINE MOSTRANDO DATOS DE INDEXEDDB)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. GESTIÓN DE NOTIFICACIONES PUSH
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
