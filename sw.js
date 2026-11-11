'use strict';

// Sube este número cada vez que cambies los archivos del App Shell
const VERSION = 'v1';
const CACHE_NOMBRE = `mi-billetera-lite-${VERSION}`;

// App Shell: todo lo necesario para renderizar la interfaz sin red
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// INSTALL: cachear el App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NOMBRE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE: borrar cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith('mi-billetera-lite-') && n !== CACHE_NOMBRE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// FETCH: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((enCache) => {
      if (enCache) return enCache;

      return fetch(req).catch(() => {
        // Sin red y sin caché: si es una navegación, devolver el App Shell
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 503, statusText: 'Sin conexión' });
      });
    })
  );
});
