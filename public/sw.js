// Keeps what you have opened, so the map still works without a connection.
// Hashed files and elevation tiles never change: they are served from the cache.
// Everything else is served from the cache at once and refreshed in the background.
const CACHE = 'odyssey-map-v1';
const CORE = ['./', 'favicon.svg', 'manifest.webmanifest', 'geo/land.json', 'geo/rivers.json', 'geo/ancient.json', 'geo/realms.json', 'geo/borders.json', 'terrain/manifest.json'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fixed = /\/assets\/|\/terrain\/\d+\//.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    if (hit && fixed) return hit;
    if (hit) { fresh.catch(() => {}); return hit; }
    try { return await fresh; } catch { return (await cache.match('./')) || Response.error(); }
  })());
});
