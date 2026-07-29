import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, EmptyState, Pagination } from '@/Components/ui';
import { formatDateTime, formatDuration } from '@/lib/format';

const TABS = [
    { key: 'today', label: 'Today' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

export default function TasksIndex({ tasks, filter, counts }) {
    const go = (key) => router.get('/tasks', { filter: key }, { preserveState: true, replace: true });

    return (
        <AuthenticatedLayout header="Daily planner">
            <Head title="Tasks" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>

            <div className="mb-4 flex flex-wrap gap-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => go(tab.key)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                            filter === tab.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
                        }`}
                    >
                        {tab.label}
                        <span className={`rounded-full px-1.5 text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            <Card className="overflow-hidden">
                {tasks.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="✅" title="No tasks here" description="Nothing to show for this filter." /></div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tasks.data.map((task) => (
                            <li key={task.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                                        <Badge color={task.status === 'completed' ? 'emerald' : task.status === 'in_progress' ? 'blue' : 'slate'}>
                                            {task.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {task.lead ? (
                                            <Link href={`/leads/${task.lead.id}`} className="text-indigo-600 hover:underline">{task.lead.name}</Link>
                                        ) : 'No lead'}
                                        {task.due_at ? ` · due ${formatDateTime(task.due_at)}` : ''}
                                        {task.time_spent_seconds ? ` · ${formatDuration(task.time_spent_seconds)} logged` : ''}
                                    </p>
                                </div>
                                {task.status !== 'completed' && (
                                    <div className="flex gap-2">
                                        {task.status === 'in_progress' ? (
                                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => router.post(`/tasks/${task.id}/stop`, {}, { preserveScroll: true })}>
                                                ⏸ Pause
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => router.post(`/tasks/${task.id}/start`, {}, { preserveScroll: true })}>
                                                ▶ Start
                                            </Button>
                                        )}
                                        <Button className="px-2 py-1 text-xs" onClick={() => router.post(`/tasks/${task.id}/complete`, {}, { preserveScroll: true })}>
                                            ✓ Complete
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <div className="mt-4 flex justify-center">
                <Pagination links={tasks.links} />
            </div>
        </AuthenticatedLayout>
    );
}
