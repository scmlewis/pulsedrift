const CACHE_NAME = 'pulsedrift-cache-v5';
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
  './icons/icon-512.svg',
  // Bell sounds
  './audio/bells/singing-bowl.mp3',
  './audio/bells/singing-bowl-completion.mp3',
  './audio/bells/soft-gong.mp3',
  './audio/bells/soft-gong-completion.mp3',
  './audio/bells/temple-bell.mp3',
  './audio/bells/temple-bell-completion.mp3',
  // Ambient sounds
  './audio/ambient/rain.mp3',
  './audio/ambient/waves.mp3',
  './audio/ambient/forest.mp3',
  './audio/ambient/wind.mp3',
  './audio/ambient/zen.mp3',
  './audio/ambient/fire.mp3',
  './audio/ambient/brown-noise.mp3',
  './audio/ambient/chants.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
