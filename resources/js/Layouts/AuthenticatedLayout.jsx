import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/Components/ThemeToggle';
import OfflineBanner from '@/Components/OfflineBanner';
import InstallPrompt from '@/Components/InstallPrompt';
import { Avatar } from '@/Components/ui';
import { isInstallable, promptInstall, onPwaEvent } from '@/pwa';

// Navigation is filtered by the user's roles. `roles` here are role slugs.
const NAV = [
    { label: 'Dashboard', href: '/dashboard', route: 'dashboard', icon: '🏠', roles: ['admin', 'manager', 'telecaller'] },
    { label: 'Leads', href: '/leads', route: 'leads.index', icon: '👥', roles: ['admin', 'manager', 'telecaller'] },
    { label: 'Tasks', href: '/tasks', route: 'tasks.index', icon: '✅', roles: ['admin', 'manager', 'telecaller'] },
    { label: 'Reports', href: '/reports', route: 'reports.index', icon: '📊', roles: ['admin', 'manager'] },
    { label: 'Performance', href: '/performance', route: 'performance.index', icon: '📈', roles: ['admin', 'manager'] },
    { label: 'Import', href: '/import', route: 'import.create', icon: '📥', roles: ['admin', 'manager'] },
    { label: 'Staff', href: '/staff', route: 'staff.index', icon: '⚙️', roles: ['admin'] },
];

// Compact set for the mobile bottom bar (telecaller-first).
const MOBILE_NAV = [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Leads', href: '/leads', icon: '👥' },
    { label: 'Tasks', href: '/tasks', icon: '✅' },
    { label: 'Alerts', href: '/notifications', icon: '🔔' },
];

function useCurrentPath() {
    const { url } = usePage();
    return url.split('?')[0];
}

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const roles = user?.roles || [];
    const unread = props.unread_notifications_count || 0;
    const flash = props.flash || {};
    const path = useCurrentPath();
    const [toast, setToast] = useState(null);

    const items = NAV.filter((i) => i.roles.some((r) => roles.includes(r)));

    const [canInstall, setCanInstall] = useState(isInstallable());

    useEffect(() => {
        return onPwaEvent((event) => {
            if (event.type === 'installable') setCanInstall(true);
            if (event.type === 'installed') setCanInstall(false);
        });
    }, []);

    const handleInstallClick = async () => {
        const accepted = await promptInstall();
        if (accepted) setCanInstall(false);
    };

    useEffect(() => {
        if (flash.success || flash.error) {
            setToast({ type: flash.success ? 'success' : 'error', message: flash.success || flash.error });
            const t = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [flash.success, flash.error]);

    const isActive = (item) => path === item.href || path.startsWith(item.href + '/');

    return (
        <div className="min-h-full">
            <OfflineBanner />

            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
                    <div className="flex h-16 items-center gap-2 px-6">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">☎</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">TeleCRM</span>
                    </div>
                    <nav className="space-y-1 px-3 py-2">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    isActive(item)
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                        {canInstall && (
                            <button
                                onClick={handleInstallClick}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                            >
                                <span>📲</span>
                                Install App
                            </button>
                        )}
                    </nav>
                </aside>

                {/* Main column */}
                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Topbar */}
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900 dark:text-white lg:hidden">TeleCRM</span>
                            {header && <div className="hidden text-sm text-slate-500 sm:block">{header}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href="/notifications"
                                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                aria-label="Notifications"
                            >
                                🔔
                                {unread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </Link>
                            <ThemeToggle />
                            <div className="ml-1 flex items-center gap-2">
                                <Avatar name={user?.name} size="sm" />
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                                    <p className="text-[11px] capitalize text-slate-400">{user?.primary_role}</p>
                                </div>
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                                    title="Log out"
                                >
                                    ⎋
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-8">{children}</main>
                </div>
            </div>

            {/* Mobile bottom navigation */}
            <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
                {MOBILE_NAV.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                            path.startsWith(item.href)
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                        {item.href === '/notifications' && unread > 0 && (
                            <span className="absolute right-6 top-1 h-2 w-2 rounded-full bg-rose-600" />
                        )}
                    </Link>
                ))}
            </nav>

            <InstallPrompt />

            {/* Flash toast */}
            {toast && (
                <div
                    className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg lg:bottom-6 ${
                        toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}
