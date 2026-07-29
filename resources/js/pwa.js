// PWA runtime helpers: service-worker registration, install prompt capture,
// online/offline events, and push-subscription helpers.

let deferredInstallPrompt = null;
const listeners = new Set();

function emit(event) {
    listeners.forEach((cb) => cb(event));
}

export function onPwaEvent(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            // A new SW is waiting -> tell the UI so it can prompt "reload to update".
            if (registration.waiting) {
                emit({ type: 'update-available', registration });
            }
            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                installing?.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        emit({ type: 'update-available', registration });
                    }
                });
            });
        } catch (error) {
            console.error('SW registration failed', error);
        }
    });

    // Capture the A2HS prompt so we can trigger it from a custom button.
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        emit({ type: 'installable' });
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        emit({ type: 'installed' });
    });

    window.addEventListener('online', () => emit({ type: 'online' }));
    window.addEventListener('offline', () => emit({ type: 'offline' }));
}

export function isInstallable() {
    return deferredInstallPrompt !== null;
}

export async function promptInstall() {
    if (!deferredInstallPrompt) return false;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === 'accepted';
}

export function skipWaiting(registration) {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
}

// ---- Web Push subscription ----------------------------------------------

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(vapidPublicKey, csrfToken) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await fetch('/push-subscriptions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
        },
        body: JSON.stringify(subscription),
    });

    return subscription;
}
