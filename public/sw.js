// MigiTrader Service Worker
// Offline-first caching strategy optimized for mobile data usage

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `migitrader-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `migitrader-dynamic-${CACHE_VERSION}`;
const API_CACHE = `migitrader-api-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/globals.css',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install event: Cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete old caches that don't match current version
                            return name.startsWith('migitrader-') && name !== STATIC_CACHE
                                && name !== DYNAMIC_CACHE && name !== API_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event: Network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests: Network-first with cache fallback
    if (url.pathname.includes('/api/') || url.pathname.includes('/market-data/')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }

    // Static assets: Cache-first
    if (STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // Dynamic content: Network-first with cache fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

/**
 * Network-first strategy: Try network, fallback to cache
 * Ideal for API calls and dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        // Try network first
        const response = await fetch(request);

        // Clone response before caching (response can only be read once)
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, responseToCache);
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, falling back to cache:', request.url);

        // Fallback to cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // If no cache available, return offline page or error
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'No internet connection. Please check your network.',
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

/**
 * Cache-first strategy: Try cache, fallback to network
 * Ideal for static assets (CSS, JS, images)
 */
async function cacheFirstStrategy(request, cacheName) {
    // Try cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    // Fallback to network
    try {
        const response = await fetch(request);
        const responseToCache = response.clone();

        const cache = await caches.open(cacheName);
        cache.put(request, responseToCache);

        return response;
    } catch (error) {
        console.error('[SW] Failed to fetch:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

// Background sync for queued trades (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-trades') {
        event.waitUntil(syncQueuedTrades());
    }
});

async function syncQueuedTrades() {
    // TODO: Implement background sync for queued Ziidi trades
    console.log('[SW] Syncing queued trades...');
}

// Push notifications (future feature for price alerts)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.message || 'New update available',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MigiTrader', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
