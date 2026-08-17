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
                    <KpiCard label="Total leads" value={kpis.total_leads} />
                    <KpiCard label="Converted" value={kpis.converted} tone="good" />
                    <KpiCard label="Conversion" value={`${kpis.conversion_rate}%`} />
                    <KpiCard label="Active staff" value={kpis.active_staff} />
                    <KpiCard label="Calls today" value={kpis.calls_today} />
                    <KpiCard label="Overdue tasks" value={kpis.overdue_tasks} tone={kpis.overdue_tasks ? 'bad' : 'default'} />
                </div>

                <PipelineBar pipeline={pipeline} />

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader title="Top performers" subtitle="By conversions" />
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leaderboard.map((s, i) => (
                                <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                    <span className="w-5 text-sm font-semibold text-slate-400">{i + 1}</span>
                                    <Avatar name={s.name} size="sm" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                                    <span className="shrink-0 text-xs text-slate-500 sm:text-sm">{s.converted_count} won</span>
                                    <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{s.calls_today} calls</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card>
                        <CardHeader title="Recent activity" />
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recent_activity.map((lead) => (
                                <li key={lead.id} className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5">
                                    <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-indigo-600 hover:underline">
                                        {lead.name}
                                    </Link>
                                    <StatusBadge status={{ label: lead.status, color: 'slate' }} />
                                    <span className="shrink-0 text-xs text-slate-400">{fromNow(lead.updated_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
