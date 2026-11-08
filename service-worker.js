// Offline cache: app shell + fonts. Bump VERSION when files change.
const VERSION = 'cotf-v3.2';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './js/icons.js', './js/data.js', './js/core.js', './js/battle.js', './js/ai.js', './js/audio.js', './js/view.js', './js/map.js',
  './js/panels.js', './js/dialogs.js', './js/battleview.js', './js/catapult.js', './js/difficulty.js', './js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isFont = url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com');
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => {
    const fetching = fetch(e.request).then(res => { if (res.ok && (url.origin === location.origin || isFont)) caches.open(VERSION).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
    return hit || fetching;
  }));
});
