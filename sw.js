const CACHE_NAME = 'bellschedule-cache-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
            return cachedResponse;
        }

        return fetch(event.request)
            .then((networkResponse) => {
            if (
                !networkResponse ||
                networkResponse.status !== 200 ||
                networkResponse.type !== 'basic'
            ) {
                return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });

            return networkResponse;
            })
            .catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
            });
        })
    );
});