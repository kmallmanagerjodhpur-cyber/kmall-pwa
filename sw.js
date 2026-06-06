const CACHE = 'kmall-v1';
const BASE = '/kmall-pwa';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/app.css',
  BASE + '/js/config.js',
  BASE + '/js/api.js',
  BASE + '/js/auth.js',
  BASE + '/js/router.js',
  BASE + '/js/utils.js',
  BASE + '/js/app.js',
  BASE + '/js/modules/dashboard.js',
  BASE + '/js/modules/attendance.js',
  BASE + '/js/modules/tasks.js',
  BASE + '/js/modules/reports.js',
  BASE + '/js/modules/expenses.js',
  BASE + '/js/modules/tenants.js',
  BASE + '/js/modules/incidents.js',
  BASE + '/js/modules/checklist.js',
  BASE + '/assets/icon-192.png',
  BASE + '/assets/icon-512.png',
  BASE + '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
      .catch(() => caches.match(BASE + '/index.html'))
  );
});
