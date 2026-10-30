const CACHE_NAME = 'horax-yo-v7';
const ASSETS_TO_CACHE = ['./', './index.html', './css/style.css', './js/app.js', './js/firebase-config.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

// Instalación: guarda lo que pueda (si falta un archivo, no se rompe todo)
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url)))));
  self.skipWaiting();
});

// Activación: borra las cachés viejas de ESTA app
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('horax-yo-') && k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Red primero: siempre trae la versión más nueva; sin internet usa la copia guardada.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(response => {
        if (response.ok) { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, clone)); }
        return response;
      })
      .catch(() => caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
