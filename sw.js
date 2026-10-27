const CACHE_NAME = 'mis-extras-v1';
const ASSETS = ['./', './index.html', './css/style.css', './js/app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => Promise.allSettled(ASSETS.map(u => c.add(u)))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Red primero: siempre trae la versión nueva; sin internet usa la copia guardada.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const cl = res.clone(); caches.open(CACHE_NAME).then(c => c.put(r, cl)); }
    return res;
  }).catch(() => caches.match(r).then(c => c || (r.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
