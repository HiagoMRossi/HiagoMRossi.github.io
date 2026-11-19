'use strict';
const CACHE_NAME = 'lumen-v0.4.3';
// URLs exatas de index.html, incluindo as versões dos scripts e da folha de estilo.
const APP_SHELL = [
  './',
  './index.html',
  './style.css?v=0.4.3',
  './config.js?v=0.4.3',
  './core.js?v=0.4.3',
  './bluetooth.js?v=0.4.3',
  './guided-lights.js?v=0.4.3',
  './wake-lock.js?v=0.4.3',
  './pwa.js?v=0.4.3',
  './app.js?v=0.4.3',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

if (typeof self !== 'undefined') {
  const shellUrls = new Set(APP_SHELL.map(file => new URL(file, self.registration.scope).href));
  self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    // Sem skipWaiting: uma atualização aguarda o fechamento das páginas antigas.
  });
  self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('lumen-') && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
  });
  self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || !shellUrls.has(url.href)) return;
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);
      return cached || fetch(event.request);
    }));
  });
}
if (typeof module !== 'undefined') module.exports = { CACHE_NAME, APP_SHELL };
