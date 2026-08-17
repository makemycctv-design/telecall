import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, EmptyState, Pagination } from '@/Components/ui';
import { fromNow } from '@/lib/format';
import { subscribeToPush } from '@/pwa';

const ICONS = {
    follow_up_reminder: '⏰',
    new_assignment: '➕',
    overdue_alert: '⚠️',
    manager_alert: '📢',
};

export default function NotificationsIndex({ notifications }) {
    const enablePush = async () => {
        const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const csrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '');
        if (!key) {
            alert('Push is not configured. Set VAPID keys in .env to enable.');
            return;
        }
        const sub = await subscribeToPush(key, csrf);
        alert(sub ? 'Push notifications enabled.' : 'Permission denied or unsupported.');
    };

    return (
        <AuthenticatedLayout header="Notifications">
            <Head title="Notifications" />
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Notifications</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={enablePush} className="text-xs sm:text-sm">🔔 Enable push</Button>
                    <Button variant="secondary" onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })} className="text-xs sm:text-sm">
                        Mark all read
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                {notifications.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="🔔" title="No notifications" description="You're all caught up." /></div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.data.map((n) => (
                            <li
                                key={n.id}
                                className={`flex items-start gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4 ${n.read_at ? '' : 'bg-indigo-50/40 dark:bg-indigo-950/20'}`}
                            >
                                <span className="shrink-0 text-lg sm:text-xl">{ICONS[n.type] || '🔔'}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                                    {n.body && <p className="text-xs text-slate-500 sm:text-sm">{n.body}</p>}
                                    <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">{fromNow(n.created_at)}</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    {n.action_url && (
                                        <Link href={n.action_url} className="text-xs font-medium text-indigo-600 hover:underline">Open</Link>
                                    )}
                                    {!n.read_at && (
                                        <button
                                            onClick={() => router.post(`/notifications/${n.id}/read`, {}, { preserveScroll: true })}
                                            className="text-[11px] text-slate-400 hover:text-slate-600 sm:text-xs"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={notifications.links} /></div>
        </AuthenticatedLayout>
    );
}
