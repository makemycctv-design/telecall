import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PipelineBar from '@/Components/PipelineBar';
import { KpiCard, Card, CardHeader, Avatar, StatusBadge } from '@/Components/ui';
import { fromNow } from '@/lib/format';

export default function AdminDashboard({ kpis, pipeline, leaderboard, recent_activity }) {
    return (
        <AuthenticatedLayout header="Admin overview">
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard label="Total leads" value={kpis.total_leads} href="/leads" />
                    <KpiCard label="Converted" value={kpis.converted} tone="good" href="/leads?status=converted" />
                    <KpiCard label="Conversion" value={`${kpis.conversion_rate}%`} href="/performance" />
                    <KpiCard label="Active staff" value={kpis.active_staff} href="/staff" />
                    <KpiCard label="Calls today" value={kpis.calls_today} href="/reports" />
                    <KpiCard label="Overdue tasks" value={kpis.overdue_tasks} tone={kpis.overdue_tasks ? 'bad' : 'default'} href="/tasks?filter=overdue" />
                </div>

                <PipelineBar pipeline={pipeline} />

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader title="Top performers" subtitle="By conversions" />
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leaderboard.map((s, i) => (
                                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                                    <span className="w-5 text-sm font-semibold text-slate-400">{i + 1}</span>
                                    <Avatar name={s.name} size="sm" />
                                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                                    <span className="text-sm text-slate-500">{s.converted_count} won</span>
                                    <span className="text-xs text-slate-400">{s.calls_today} calls</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card>
                        <CardHeader title="Recent activity" />
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recent_activity.map((lead) => (
                                <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                                    <Link href={`/leads/${lead.id}`} className="flex-1 text-sm font-medium text-indigo-600 hover:underline">
                                        {lead.name}
                                    </Link>
                                    <StatusBadge status={{ label: lead.status, color: 'slate' }} />
                                    <span className="text-xs text-slate-400">{fromNow(lead.updated_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
