import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { KpiCard, Card, CardHeader, EmptyState, Badge } from '@/Components/ui';
import { formatDate, fromNow } from '@/lib/format';

export default function ExecutorDashboard({ kpis, active_projects }) {
    return (
        <AuthenticatedLayout header="My work">
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard label="Active projects" value={kpis.active} />
                    <KpiCard label="In progress" value={kpis.in_progress} tone="warn" />
                    <KpiCard label="Due in 3 days" value={kpis.due_soon} tone={kpis.due_soon ? 'warn' : 'default'} />
                    <KpiCard label="Overdue" value={kpis.overdue} tone={kpis.overdue ? 'bad' : 'default'} />
                    <KpiCard label="Completed" value={kpis.completed} tone="good" />
                    <KpiCard label="Logged today" value={kpis.logged_today} />
                </div>

                <Card>
                    <CardHeader
                        title="Active projects"
                        subtitle="Your assigned work"
                        action={<Link href="/projects" className="text-xs font-medium text-indigo-600">All projects →</Link>}
                    />
                    {active_projects.length === 0 ? (
                        <div className="p-5">
                            <EmptyState icon="🗂️" title="No active projects" description="Assigned projects will appear here." />
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {active_projects.map((p) => {
                                const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
                                return (
                                    <li key={p.id} className="px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <Link href={`/projects/${p.id}`} className="font-medium text-indigo-600 hover:underline">
                                                    {p.title}
                                                </Link>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {p.lead?.name}{p.lead?.company ? ` · ${p.lead.company}` : ''}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <Badge color={overdue ? 'rose' : 'blue'}>
                                                    {p.deadline ? (overdue ? 'Overdue' : `Due ${formatDate(p.deadline)}`) : 'No deadline'}
                                                </Badge>
                                                <p className="mt-1 text-[11px] text-slate-400">{p.deadline ? fromNow(p.deadline) : ''}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${p.progress_percent || 0}%` }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
