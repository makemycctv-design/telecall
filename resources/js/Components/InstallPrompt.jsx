import { useEffect, useState } from 'react';
import { onPwaEvent, isInstallable, promptInstall } from '@/pwa';

// Custom "Add to Home Screen" prompt, shown once the browser fires
// beforeinstallprompt. Dismissal is remembered in localStorage.
export default function InstallPrompt() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('telecrm-install-dismissed');
        if (isInstallable() && !dismissed) setVisible(true);

        return onPwaEvent((event) => {
            if (event.type === 'installable' && !localStorage.getItem('telecrm-install-dismissed')) {
                setVisible(true);
            }
            if (event.type === 'installed') setVisible(false);
        });
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:bottom-4">
            <div className="flex items-start gap-3">
                <div className="text-2xl">📲</div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Install Amarizz Crm</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Add it to your home screen for a faster, full-screen, offline-ready experience.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={async () => {
                                await promptInstall();
                                setVisible(false);
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                            Install
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem('telecrm-install-dismissed', '1');
                                setVisible(false);
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
