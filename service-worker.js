/* 八卦星云图 PWA Service Worker
   策略: 核心文件 network-first 回退缓存; 图片/库 cache-first */
const CACHE_VERSION = 'yiglobe-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './hexdetail.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(CORE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 仅缓存同源资源
  if (url.origin !== location.origin) return;
  // cache-first (图片和库)
  if (/\.(jpg|jpeg|png|webp|svg|gif|ico|js|css|woff2?)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
    return;
  }
  // network-first for HTML
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
