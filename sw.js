const CACHE_NAME = 'gra-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './src/app.js',
  './src/Game.js',
  './src/systems/Animator.js',
  './src/systems/Camera.js',
  './src/systems/LevelGenerator.js',
  './src/systems/BiomesManager.js',
  './src/systems/AssetsManager.js',
  './src/systems/Sprite.js',
  './src/enums.js',
  './src/entities/Platform.js',
  './src/entities/Player.js',
  './src/utils/screenShake.js',
  './src/utils/TimeManager.js',
  './src/utils/vJoyShot.js',
  './manifest.json',
  './images/jk.png',
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