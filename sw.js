const CACHE_NAME = 'gra-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './src/app.js',
  './src/Game.js',
  './src/firebase.js',
  './src/systems/Animator.js',
  './src/systems/Camera.js',
  './src/systems/LevelGenerator.js',
  './src/systems/BiomesManager.js',
  './src/systems/AssetsManager.js',
  './src/systems/Sprite.js',
  './src/systems/ParticleSystem.js',
  './src/enums.js',
  './src/entities/Platform.js',
  './src/entities/Player.js',
  './src/entities/PowerUp.js',
  './src/entities/Hazard.js',
  './src/entities/Fish.js',
  './src/utils/screenShake.js',
  './src/utils/TimeManager.js',
  './src/utils/vJoyShot.js',
  './images/jk-v3.png',
  './images/assets.png',
  './images/cat.png',
  './images/default-cat.png',
  './images/wings.png',
  './images/powerup_jetpack.png',
  './images/powerup_shoes.png',
  './images/powerup_strength.png',
  './images/fish.png',
];

self.addEventListener('install', () => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.isFirstInstall = true;
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );

  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) =>
      client.postMessage({
        type: 'APP_UPDATED',
        firstInstall: !!self.isFirstInstall,
      })
    );
  });

  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, clone);
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Nowość!', {
      body: data.body,
      icon: '/images/jk-v4.png',
    })
  );
});
