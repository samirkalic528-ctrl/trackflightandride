const CACHE_NAME = 'city-taxi-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap',
    'https://unpkg.com/lucide@latest'
];

// Install Service Worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Keširanje resursa');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Service Worker and clear old cache versions
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Uklanjanje starog keša:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch resources using Network-First strategy (always get newest from server)
self.addEventListener('fetch', (e) => {
    // Only intercept GET requests, don't intercept API POST/PUT requests
    if (e.request.method !== 'GET' || e.request.url.includes('/api/')) {
        return;
    }

    e.respondWith(
        fetch(e.request).then((networkResponse) => {
            // Update cache dynamically with the fresh response
            if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            // If offline, fallback to cached assets
            return caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Fallback to index.html if text/html is requested
                if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
