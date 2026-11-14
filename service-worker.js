// The game moved to https://jdc001.github.io/Anointed/. This worker replaces the old offline cache: it clears it,
// steps aside, and sends any open copy of the old game to the new address.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('cotf-')) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) { try { await c.navigate('https://jdc001.github.io/Anointed/'); } catch (e) { } }
  })());
});
