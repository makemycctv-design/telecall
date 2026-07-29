import { useEffect, useState } from 'react';
import { onPwaEvent } from '@/pwa';

// Shows a sticky banner when the connection drops, and an "update available"
// prompt when a new service worker is waiting.
export default function OfflineBanner() {
    const [offline, setOffline] = useState(!navigator.onLine);
    const [updateReg, setUpdateReg] = useState(null);

    useEffect(() => {
        return onPwaEvent((event) => {
            if (event.type === 'offline') setOffline(true);
            if (event.type === 'online') setOffline(false);
            if (event.type === 'update-available') setUpdateReg(event.registration);
        });
    }, []);

    if (updateReg) {
        return (
            <div className="flex items-center justify-center gap-3 bg-indigo-600 px-4 py-2 text-center text-sm text-white">
                A new version is available.
                <button
                    onClick={() => {
                        updateReg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                    }}
                    className="rounded bg-white/20 px-2 py-0.5 font-medium hover:bg-white/30"
                >
                    Reload
                </button>
            </div>
        );
    }

    if (offline) {
        return (
            <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-white" />
                You are offline — changes will sync automatically when reconnected.
            </div>
        );
    }

    return null;
}
