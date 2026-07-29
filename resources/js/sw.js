/* global self, caches, clients, indexedDB */
// Hand-rolled service worker (vite-plugin-pwa injectManifest strategy).
//
// Responsibilities:
//   1. Precache the app shell (build assets injected by vite-plugin-pwa).
//   2. Runtime caching:
//        - navigations & Inertia pages -> network-first w/ offline fallback
//        - GET API/JSON (recently viewed leads & tasks) -> stale-while-revalidate
//        - static assets -> cache-first
//   3. Background Sync: queue failed POSTs (call logs / notes) in IndexedDB and
//      replay them when connectivity returns.
//   4. Web Push: display notifications and focus/open the relevant page on click.

const PRECACHE = 'telecrm-precache-v1';
const RUNTIME = 'telecrm-runtime-v1';
const OFFLINE_URL = '/offline.html';

// Injected at build time by vite-plugin-pwa. Reference is mandatory.
const MANIFEST = self.__WB_MANIFEST || [];
const PRECACHE_URLS = [OFFLINE_URL, ...MANIFEST.map((entry) => entry.url)];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((k) => ![PRECACHE, RUNTIME].includes(k)).map((k) => caches.delete(k)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isApiRequest(url) {
    return url.pathname.startsWith('/api/') || url.pathname.endsWith('.json');
}

function isStaticAsset(url) {
    return /\.(?:js|css|png|jpg|jpeg|svg|gif|woff2?|ico)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    // Queue mutating requests for background sync when offline.
    if (request.method === 'POST' && shouldQueue(url)) {
        event.respondWith(networkWithQueueFallback(request.clone()));
        return;
    }

    if (request.method !== 'GET') return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    if (isApiRequest(url)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
    }
});

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || caches.match(OFFLINE_URL);
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
    return response;
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then((response) => {
            cache.put(request, response.clone());
            return response;
        })
        .catch(() => cached);
    return cached || network;
}

// ---- Background Sync (IndexedDB queue) -----------------------------------

const DB_NAME = 'telecrm-sync';
const STORE = 'outbox';

function shouldQueue(url) {
    return /\/(call-logs|leads\/\d+\/notes)$/.test(url.pathname);
}

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function queueRequest(request) {
    const body = await request.text();
    const db = await openDb();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).add({
            url: request.url,
            method: request.method,
            headers: [...request.headers.entries()],
            body,
            queuedAt: Date.now(),
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
    if ('sync' in self.registration) {
        try {
            await self.registration.sync.register('telecrm-outbox');
        } catch (_) {
            /* Background Sync unsupported — will retry on next launch. */
        }
    }
}

async function networkWithQueueFallback(request) {
    try {
        return await fetch(request);
    } catch (error) {
        await queueRequest(request);
        return new Response(
            JSON.stringify({ queued: true, message: 'Saved offline. Will sync when back online.' }),
            { status: 202, headers: { 'Content-Type': 'application/json' } },
        );
    }
}

self.addEventListener('sync', (event) => {
    if (event.tag === 'telecrm-outbox') event.waitUntil(flushOutbox());
});

async function flushOutbox() {
    const db = await openDb();
    const items = await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
    });

    for (const item of items) {
        try {
            const response = await fetch(item.url, {
                method: item.method,
                headers: item.headers,
                body: item.body,
            });
            if (response.ok || response.status === 422) {
                await deleteItem(db, item.id);
            }
        } catch (_) {
            break; // still offline; stop and retry later
        }
    }
}

function deleteItem(db, id) {
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = resolve;
    });
}

// ---- Web Push ------------------------------------------------------------

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_) {
        payload = { title: 'TeleCRM', body: event.data ? event.data.text() : '' };
    }

    const title = payload.title || 'TeleCRM';
    const options = {
        body: payload.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: payload.tag || 'telecrm',
        data: { url: payload.url || '/dashboard' },
        vibrate: [80, 40, 80],
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/dashboard';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((all) => {
            const existing = all.find((c) => c.url.includes(target));
            if (existing) return existing.focus();
            return clients.openWindow(target);
        }),
    );
});
