// Service Worker — офлайн-режим для «Девичника»
// Меняй версию кэша при обновлении файлов, чтобы у пользователей подтянулось новое.
const CACHE = 'devichnik-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './og-image.png'
];

// Установка — кладём оболочку приложения в кэш
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Активация — чистим старые версии кэша
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Запросы — отдаём из кэша, в фоне обновляем; шрифты Google кэшируем при первой загрузке
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        const ok = res && res.status === 200;
        const cacheable = ok && (req.url.startsWith(self.location.origin) || /fonts\.(googleapis|gstatic)\.com/.test(req.url));
        if (cacheable) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || network;
    })
  );
});
