import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, EmptyState, Pagination } from '@/Components/ui';
import { fromNow } from '@/lib/format';

const ICONS = {
    follow_up_reminder: '⏰',
    new_assignment: '➕',
    overdue_alert: '⚠️',
    manager_alert: '📢',
    project_assigned: '🗂️',
};

export default function NotificationsIndex({ notifications }) {
    return (
        <AuthenticatedLayout header="Notifications">
            <Head title="Notifications" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Notifications</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}>
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
                                className={`flex items-start gap-3 px-5 py-4 ${n.read_at ? '' : 'bg-indigo-50/40 dark:bg-indigo-950/20'}`}
                            >
                                <span className="text-xl">{ICONS[n.type] || '🔔'}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                                    {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
                                    <p className="mt-0.5 text-xs text-slate-400">{fromNow(n.created_at)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {n.action_url && (
                                        <Link href={n.action_url} className="text-xs font-medium text-indigo-600 hover:underline">Open</Link>
                                    )}
                                    {!n.read_at && (
                                        <button
                                            onClick={() => router.post(`/notifications/${n.id}/read`, {}, { preserveScroll: true })}
                                            className="text-xs text-slate-400 hover:text-slate-600"
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
