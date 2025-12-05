const CACHE_NAME = 'gra-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './js/app.js',
  './js/animator.js',
  './js/screenShake.js',
  './js/TimeManager.js',
  './js/vJoyShot.js',
  './manifest.json',
  './images/helmet_02d.png',
  './images/sword_03b.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});