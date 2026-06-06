const CACHE = 'kmall-v1';
const ASSETS = ['/', '/index.html', '/css/app.css', '/js/config.js', '/js/api.js',
  '/js/auth.js', '/js/router.js', '/js/utils.js', '/js/app.js',
  '/js/modules/dashboard.js', '/js/modules/attendance.js', '/js/modules/tasks.js',
  '/js/modules/reports.js', '/js/modules/expenses.js', '/js/modules/tenants.js',
  '/js/modules/incidents.js', '/js/modules/checklist.js',
  '/assets/icon-192.png', '/assets/icon-512.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});
