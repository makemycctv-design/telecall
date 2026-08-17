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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [path]);

    const isActive = (item) => path === item.href || path.startsWith(item.href + '/');

    return (
        <div className="min-h-full">
            <OfflineBanner />

            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
                    <div className="flex h-16 items-center gap-2 px-6">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">☎</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">Amarizz Crm</span>
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

                {/* Mobile sidebar overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                        <aside className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl dark:bg-slate-900">
                            {/* Header */}
                            <div className="flex h-14 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white text-sm">☎</span>
                                    <span className="text-base font-bold text-slate-900 dark:text-white">Amarizz Crm</span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                                {items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                                            isActive(item)
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}

                                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                                <Link
                                    href="/notifications"
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                                        path === '/notifications'
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-lg">🔔</span>
                                    Notifications
                                    {unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
                                </Link>
                                <Link
                                    href="/profile"
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                                        path === '/profile'
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-lg">👤</span>
                                    My Profile
                                </Link>
                                {canInstall && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-indigo-600 transition-all active:scale-[0.97] hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                                    >
                                        <span className="text-lg">📲</span>
                                        Install App
                                    </button>
                                )}
                            </nav>

                            {/* User footer */}
                            <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Avatar name={user?.name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                                        <p className="text-xs capitalize text-slate-400 truncate">{user?.primary_role}</p>
                                    </div>
                                    <button
                                        onClick={() => router.post('/logout')}
                                        className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                                        title="Log out"
                                    >
                                        ⎋
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {/* Main column */}
                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Topbar */}
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                                aria-label="Open menu"
                            >
                                ☰
                            </button>
                            <span className="text-lg font-bold text-slate-900 dark:text-white lg:hidden">Amarizz Crm</span>
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
                                <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit Profile">
                                    <Avatar name={user?.name} size="sm" />
                                    <div className="hidden text-right sm:block">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                                        <p className="text-[11px] capitalize text-slate-400">{user?.primary_role}</p>
                                    </div>
                                </Link>
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

                    <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:pb-8">{children}</main>
                </div>
            </div>

            <InstallPrompt />

            {/* Flash toast */}
            {toast && (
                <div
                    className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
                        toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}
