// Naikkan versi ini (v1 -> v2, dst) setiap kali file app di-update,
// supaya pengguna lama otomatis dapat versi terbaru.
const CACHE_NAME = 'buku-kwitansi-v3';

const APP_SHELL = [
  './',
  './index.html',
  './app.jsx',
  './firebase-config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// App shell: cache-first (jalan offline).
// Request lain (mis. Firestore/CDN): network-first, fallback ke cache kalau offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isAppShell = APP_SHELL.some((path) =>
    event.request.url.endsWith(path.replace('./', '/'))
  );

  if (isAppShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
