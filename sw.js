const CACHE_NAME = 'pulsedrift-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './constants.js',
  './app.js',
  './guided.js',
  './enhancements.js',
  './sw.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

const AUDIO_ASSETS = [
  './audio/bells/singing-bowl.wav',
  './audio/bells/gong.wav',
  './audio/bells/temple-bell.wav',
  './audio/ambient/rain.wav',
  './audio/ambient/ocean-waves.wav',
  './audio/ambient/forest.wav',
  './audio/ambient/wind.wav',
  './audio/ambient/fire.wav',
  './audio/ambient/brown-noise.wav',
  './audio/ambient/zen-chimes.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache core assets immediately
      return cache.addAll(ASSETS).then(() => {
        // Attempt to cache audio files (non-blocking failure)
        return Promise.allSettled(
          AUDIO_ASSETS.map(url => cache.add(url).catch(() => null))
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first strategy for audio files
  if (request.url.includes('/audio/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
