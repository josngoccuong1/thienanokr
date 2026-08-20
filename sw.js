/* Thiên Ân — Service Worker
 * - Cache "vỏ app" (app-firebase.html + icon) để mở nhanh & chạy khi mất mạng.
 * - Same-origin: NETWORK-FIRST → luôn lấy bản mới nhất đã deploy, offline thì lấy cache.
 * - Cross-origin (Firebase/gstatic/API): LUÔN ra mạng, KHÔNG cache (dữ liệu phải tươi).
 * Tăng CACHE_VERSION mỗi lần deploy lớn để buộc xoá cache cũ.
 */
const CACHE_VERSION = 'thienan-v3';
const SHELL = ['./app-firebase.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Cross-origin (Firebase, gstatic, API) → luôn ra mạng, không đụng cache
  if (url.origin !== self.location.origin) return;
  // Same-origin → network-first, offline fallback về cache
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./app-firebase.html')))
  );
});
