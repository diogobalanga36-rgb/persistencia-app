// PERSISTÊNCIA — Service Worker v1
const CACHE_NAME = 'persistencia-v1';

// Ficheiros a guardar em cache (app shell)
const CACHE_URLS = [
  '/',
  '/index.html',
];

// Instalar — guardar app shell em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Ignora erros de cache (ficheiros podem não existir em dev)
      });
    })
  );
  self.skipWaiting();
});

// Activar — limpar caches antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', event => {
  // Ignorar requests que não são GET
  if(event.request.method !== 'GET') return;
  // Ignorar Firebase e APIs externas
  const url = event.request.url;
  if(url.includes('firestore.googleapis.com') ||
     url.includes('firebase') ||
     url.includes('googleapis.com') ||
     url.includes('gstatic.com') ||
     url.includes('jsdelivr') ||
     url.includes('unpkg.com') ||
     url.includes('generativelanguage')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar em cache se for bem sucedido
        if(response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sem internet — tentar cache
        return caches.match(event.request);
      })
  );
});
