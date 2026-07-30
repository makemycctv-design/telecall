import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AssignProjectModal from '@/Components/AssignProjectModal';
import { Card, CardHeader, Badge, Button, EmptyState, Pagination } from '@/Components/ui';
import { formatDate, formatCurrency, fromNow } from '@/lib/format';

const TABS = [
    { key: 'open', label: 'Active' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
];

export default function ProjectsManage({ projects, filter, counts, statuses, awaitingHandoff, executors }) {
    const [assignLead, setAssignLead] = useState(null);
    const go = (key) => router.get('/projects', { filter: key }, { preserveState: true, replace: true });
    const statusMeta = (v) => statuses.find((s) => s.value === v) || { label: v, color: 'slate' };

    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h1>

            {/* Converted leads awaiting handoff to an executor */}
            <Card className="mb-6">
                <CardHeader
                    title="Converted leads — awaiting assignment"
                    subtitle="Assign each converted lead to an executor to start execution"
                />
                {awaitingHandoff.length === 0 ? (
                    <div className="p-5">
                        <EmptyState icon="✅" title="Nothing to assign" description="Converted leads will show up here for handoff." />
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {awaitingHandoff.map((lead) => (
                            <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                                <div className="min-w-0 flex-1">
                                    <Link href={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                                        {lead.name}
                                    </Link>
                                    <p className="text-xs text-slate-400">
                                        {lead.phone}{lead.company ? ` · ${lead.company}` : ''}
                                        {lead.deal_value ? ` · ${formatCurrency(lead.deal_value)}` : ''}
                                        {lead.converted_at ? ` · converted ${fromNow(lead.converted_at)}` : ''}
                                    </p>
                                </div>
                                <Button className="px-3 py-1.5 text-xs" onClick={() => setAssignLead(lead)}>
                                    Assign →
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {/* All projects */}
            <div className="mb-3 flex flex-wrap gap-2">
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
                    <div className="p-6"><EmptyState icon="🗂️" title="No projects" description="Assign a converted lead to create one." /></div>
                ) : (
                    <div className="scrollbar-thin overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Project</th>
                                    <th className="px-5 py-3 font-medium">Executor</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Progress</th>
                                    <th className="px-5 py-3 font-medium">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {projects.data.map((p) => {
                                    const meta = statusMeta(p.status);
                                    const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
                                    return (
                                        <tr
                                            key={p.id}
                                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            onClick={() => router.visit(`/projects/${p.id}`)}
                                        >
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                                                <p className="text-xs text-slate-400">{p.lead?.name}</p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.executor?.name || '—'}</td>
                                            <td className="px-5 py-3"><Badge color={meta.color}>{meta.label}</Badge></td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${p.progress_percent || 0}%` }} />
                                                    </div>
                                                    <span className="text-xs text-slate-400">{p.progress_percent || 0}%</span>
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                                {p.deadline ? formatDate(p.deadline) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={projects.links} /></div>

            <AssignProjectModal
                open={!!assignLead}
                onClose={() => setAssignLead(null)}
                lead={assignLead}
                executors={executors}
            />
        </AuthenticatedLayout>
    );
}
