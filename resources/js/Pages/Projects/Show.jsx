import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Badge, Field, Input, Select, Textarea, EmptyState, Avatar } from '@/Components/ui';
import { formatDate, formatDateTime } from '@/lib/format';

export default function ProjectShow({ project, statuses, canManage, isExecutor }) {
    const statusMeta = statuses.find((s) => s.value === project.status) || { label: project.status, color: 'slate' };
    const overdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';
    const canEdit = canManage || isExecutor;

    const changeStatus = (value) =>
        router.patch(`/projects/${project.id}`, { status: value }, { preserveScroll: true });

    return (
        <AuthenticatedLayout header="Project">
            <Head title={project.title} />

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <Link href="/projects" className="hover:text-indigo-600">Projects</Link>
                <span>/</span>
                <span className="truncate text-slate-700 dark:text-slate-300">{project.title}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column: details + status + daily log form */}
                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{project.title}</h2>
                                <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                            </div>
                            {project.lead && (
                                <p className="mt-1 text-sm text-slate-500">
                                    <Link href={`/leads/${project.lead.id}`} className="text-indigo-600 hover:underline">
                                        {project.lead.name}
                                    </Link>
                                    {project.lead.company ? ` · ${project.lead.company}` : ''}
                                    {project.lead.phone ? ` · ${project.lead.phone}` : ''}
                                </p>
                            )}
                        </div>
                        <div className="space-y-3 px-5 py-4 text-sm">
                            {project.description && (
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-400">Work to be completed</p>
                                    <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-300">{project.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-400">Start</p>
                                    <p className="mt-0.5 text-slate-700 dark:text-slate-300">{project.start_date ? formatDate(project.start_date) : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-400">Deadline</p>
                                    <p className={`mt-0.5 font-medium ${overdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {project.deadline ? formatDate(project.deadline) : '—'}
                                        {project.duration_days ? ` (${project.duration_days}d)` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>Progress</span><span>{project.progress_percent || 0}%</span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${project.progress_percent || 0}%` }} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                                <Avatar name={project.executor?.name} size="sm" />
                                <span>Executor: <span className="text-slate-600 dark:text-slate-300">{project.executor?.name}</span></span>
                            </div>
                            {project.assigned_by && (
                                <p className="text-xs text-slate-400">Assigned by {project.assigned_by?.name}</p>
                            )}

                            {canEdit && (
                                <Field label="Update status" className="pt-2">
                                    <Select value={project.status} onChange={(e) => changeStatus(e.target.value)}>
                                        {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </Select>
                                </Field>
                            )}
                        </div>
                    </Card>

                    {/* Only the assigned Executor records daily work logs. */}
                    {isExecutor && <DailyLogForm projectId={project.id} currentProgress={project.progress_percent || 0} />}
                </div>

                {/* Right column: daily work log timeline */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader title="Daily work log" subtitle={`${project.logs.length} entr${project.logs.length === 1 ? 'y' : 'ies'}`} />
                        <div className="px-5 py-4">
                            {project.logs.length === 0 ? (
                                <EmptyState icon="📝" title="No log entries yet" description="Daily progress updates will appear here." />
                            ) : (
                                <ol className="relative space-y-5 border-l border-slate-200 pl-5 dark:border-slate-700">
                                    {project.logs.map((log) => (
                                        <li key={log.id} className="relative">
                                            <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(log.log_date)}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    {log.hours_spent ? <span>{log.hours_spent}h</span> : null}
                                                    {log.progress_percent != null ? <Badge color="blue">{log.progress_percent}%</Badge> : null}
                                                </div>
                                            </div>
                                            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{log.activities}</p>
                                            {log.remarks && (
                                                <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                    ⚠ {log.remarks}
                                                </p>
                                            )}
                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                by {log.user?.name} · {formatDateTime(log.created_at)}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DailyLogForm({ projectId, currentProgress }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        log_date: new Date().toISOString().slice(0, 10),
        activities: '',
        progress_percent: currentProgress,
        hours_spent: '',
        remarks: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/projects/${projectId}/logs`, {
            preserveScroll: true,
            onSuccess: () => reset('activities', 'hours_spent', 'remarks'),
        });
    };

    return (
        <Card>
            <CardHeader title="Add today's work log" subtitle="Record activities, progress & any issues" />
            <form onSubmit={submit} className="space-y-3 px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date" error={errors.log_date}>
                        <Input type="date" value={data.log_date} onChange={(e) => setData('log_date', e.target.value)} />
                    </Field>
                    <Field label="Hours spent" error={errors.hours_spent}>
                        <Input type="number" step="0.5" min="0" max="24" value={data.hours_spent}
                            onChange={(e) => setData('hours_spent', e.target.value)} placeholder="e.g. 4" />
                    </Field>
                </div>
                <Field label="Activities completed *" error={errors.activities}>
                    <Textarea rows={3} value={data.activities} onChange={(e) => setData('activities', e.target.value)}
                        placeholder="What did you complete today?" />
                </Field>
                <Field label={`Overall progress: ${data.progress_percent}%`} error={errors.progress_percent}>
                    <input type="range" min="0" max="100" step="5" value={data.progress_percent}
                        onChange={(e) => setData('progress_percent', Number(e.target.value))}
                        className="w-full accent-indigo-600" />
                </Field>
                <Field label="Remarks / issues" error={errors.remarks}>
                    <Textarea rows={2} value={data.remarks} onChange={(e) => setData('remarks', e.target.value)}
                        placeholder="Any blockers, notes or issues encountered…" />
                </Field>
                <Button type="submit" disabled={processing}>{processing ? 'Saving…' : 'Add log'}</Button>
            </form>
        </Card>
    );
}
