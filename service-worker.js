// Offline cache: app shell + fonts. Bump VERSION when files change.
const VERSION = 'cotf-v6.28';
// fetch straight from the server, never from the browser's own HTTP cache, so a new version never caches old files
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './js/icons.js', './js/data.js', './js/core.js', './js/battle.js', './js/ai.js', './js/powers.js', './js/audio.js', './js/view.js', './js/map.js',
  './js/panels.js', './js/dialogs.js', './js/saves.js', './js/replay.js', './js/tutor.js', './js/minigames.js', './js/dealings.js', './js/diplomacy.js', './js/stats.js', './js/heraldry.js', './js/ending.js', './js/battleview.js', './js/catapult.js', './js/difficulty.js', './js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('cotf-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isFont = url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com');
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => {
    const fetching = fetch(url.origin === location.origin ? new Request(e.request.url, { cache: 'no-cache' }) : e.request).then(res => { if (res.ok && (url.origin === location.origin || isFont)) caches.open(VERSION).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
    return hit || fetching;
  }));
});
