import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Badge, EmptyState, Pagination } from '@/Components/ui';
import { formatDate, fromNow } from '@/lib/format';

const TABS = [
    { key: 'open', label: 'Active' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
];

export default function ProjectsIndex({ projects, filter, counts, statuses }) {
    const go = (key) => router.get('/projects', { filter: key }, { preserveState: true, replace: true });
    const statusMeta = (v) => statuses.find((s) => s.value === v) || { label: v, color: 'slate' };

    return (
        <AuthenticatedLayout header="My projects">
            <Head title="Projects" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">My Projects</h1>

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
                {projects.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="🗂️" title="No projects here" description="Nothing to show for this filter." /></div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {projects.data.map((p) => {
                            const meta = statusMeta(p.status);
                            const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
                            return (
                                <li key={p.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/projects/${p.id}`} className="font-medium text-indigo-600 hover:underline">
                                                    {p.title}
                                                </Link>
                                                <Badge color={meta.color}>{meta.label}</Badge>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {p.lead?.name}{p.lead?.company ? ` · ${p.lead.company}` : ''}
                                                {p.lead?.phone ? ` · ${p.lead.phone}` : ''}
                                            </p>
                                            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${p.progress_percent || 0}%` }} />
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <Badge color={overdue ? 'rose' : 'slate'}>
                                                {p.deadline ? (overdue ? 'Overdue' : formatDate(p.deadline)) : 'No deadline'}
                                            </Badge>
                                            <p className="mt-1 text-[11px] text-slate-400">{p.deadline ? fromNow(p.deadline) : ''}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={projects.links} /></div>
        </AuthenticatedLayout>
    );
}
