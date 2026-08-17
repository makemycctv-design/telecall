import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PipelineBar from '@/Components/PipelineBar';
import { KpiCard, Card, CardHeader, EmptyState, Button } from '@/Components/ui';
import { formatDuration, formatDateTime, fromNow } from '@/lib/format';

export default function TelecallerDashboard({ kpis, pipeline, due_tasks, pending_callbacks }) {
    return (
        <AuthenticatedLayout header="My day">
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <KpiCard label="My open leads" value={kpis.my_leads} href="/leads" />
                    <KpiCard label="Calls today" value={kpis.calls_today} href="/leads" />
                    <KpiCard label="Talk time" value={formatDuration(kpis.talk_time)} href="/leads" />
                    <KpiCard label="Converted" value={kpis.converted} tone="good" href="/leads?status=converted" />
                    <KpiCard label="Due today" value={kpis.due_today} tone="warn" href="/tasks?filter=due_today" />
                    <KpiCard label="Overdue" value={kpis.overdue} tone={kpis.overdue ? 'bad' : 'default'} href="/tasks?filter=overdue" />
                </div>

                <PipelineBar pipeline={pipeline} />

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader title="Today's tasks" action={<Link href="/tasks" className="text-xs font-medium text-indigo-600">All tasks →</Link>} />
                        {due_tasks.length === 0 ? (
                            <div className="p-5"><EmptyState icon="🎉" title="Nothing due" description="You're all caught up for now." /></div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {due_tasks.map((task) => (
                                    <li key={task.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {task.lead?.name} · {task.due_at ? formatDateTime(task.due_at) : 'No due date'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="px-2 py-1 text-xs self-start sm:self-center"
                                            onClick={() => router.post(`/tasks/${task.id}/complete`)}
                                        >
                                            Done
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHeader title="Pending callbacks" />
                        {pending_callbacks.length === 0 ? (
                            <div className="p-5"><EmptyState icon="📞" title="No callbacks" description="No callbacks scheduled." /></div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pending_callbacks.map((lead) => (
                                    <li key={lead.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
                                        <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0 text-sm font-medium text-indigo-600 hover:underline truncate">
                                            {lead.name}
                                            <span className="ml-2 text-xs text-slate-400">{lead.phone}</span>
                                        </Link>
                                        <span className="text-xs text-slate-400">{fromNow(lead.next_follow_up_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
