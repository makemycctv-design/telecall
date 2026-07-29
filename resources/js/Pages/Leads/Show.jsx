import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CallLogForm from '@/Components/CallLogForm';
import { Card, CardHeader, Button, Badge, StatusBadge, Select, Field, Avatar, EmptyState } from '@/Components/ui';
import { formatDateTime, formatDuration, fromNow, formatCurrency } from '@/lib/format';

export default function LeadShow({ lead, timeline, options, callOutcomes }) {
    const { props } = usePage();
    const roles = props.auth?.user?.roles || [];
    const canAssign = roles.includes('admin') || roles.includes('manager');

    const [status, setStatus] = useState(lead.status);
    const [assignee, setAssignee] = useState(lead.assigned_to || '');

    const changeStatus = (value) => {
        setStatus(value);
        router.patch(`/leads/${lead.id}/status`, { status: value }, { preserveScroll: true });
    };

    const changeAssignee = (value) => {
        setAssignee(value);
        router.patch(`/leads/${lead.id}/assign`, { assigned_to: value }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header="Lead detail">
            <Head title={lead.name} />

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <Link href="/leads" className="hover:text-indigo-600">Leads</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300">{lead.name}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: profile + actions */}
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <Avatar name={lead.name} size="lg" />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{lead.name}</h2>
                                <p className="text-sm text-slate-500">{lead.company || 'No company'}</p>
                            </div>
                        </div>
                        <dl className="space-y-2 px-5 py-4 text-sm">
                            <Row label="Phone"><a href={`tel:${lead.phone}`} className="font-medium text-indigo-600">{lead.phone}</a></Row>
                            {lead.email && <Row label="Email">{lead.email}</Row>}
                            {lead.city && <Row label="City">{lead.city}</Row>}
                            {lead.source && <Row label="Source">{lead.source.name}</Row>}
                            {lead.deal_value && <Row label="Deal value">{formatCurrency(lead.deal_value)}</Row>}
                            <Row label="Priority"><Badge color={priorityColor(lead.priority, options)}>{lead.priority}</Badge></Row>
                            {lead.tags?.length > 0 && (
                                <Row label="Tags">
                                    <span className="flex flex-wrap gap-1">
                                        {lead.tags.map((t) => <Badge key={t.id} color={t.color}>{t.name}</Badge>)}
                                    </span>
                                </Row>
                            )}
                        </dl>
                    </Card>

                    <Card className="p-5">
                        <Field label="Status" className="mb-3">
                            <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
                                {options.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </Select>
                        </Field>
                        {canAssign && (
                            <Field label="Assigned to">
                                <Select value={assignee} onChange={(e) => changeAssignee(e.target.value)}>
                                    <option value="">Unassigned</option>
                                    {options.telecallers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </Select>
                            </Field>
                        )}
                    </Card>
                </div>

                {/* Middle: log a call */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Log a call" subtitle="Works offline — syncs later" />
                        <div className="px-5 py-4">
                            <CallLogForm lead={lead} outcomes={callOutcomes} />
                        </div>
                    </Card>

                    {lead.next_follow_up_at && (
                        <Card className="px-5 py-4">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Next follow-up</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {formatDateTime(lead.next_follow_up_at)}
                                <span className="ml-2 font-normal text-slate-400">{fromNow(lead.next_follow_up_at)}</span>
                            </p>
                        </Card>
                    )}
                </div>

                {/* Right: activity timeline */}
                <div>
                    <Card>
                        <CardHeader title="Activity timeline" subtitle={`${timeline.length} events`} />
                        <div className="px-5 py-4">
                            {timeline.length === 0 ? (
                                <EmptyState icon="🕓" title="No activity yet" description="Logged calls and status changes will appear here." />
                            ) : (
                                <ol className="relative space-y-5 border-l border-slate-200 pl-5 dark:border-slate-700">
                                    {timeline.map((event, i) => (
                                        <li key={i} className="relative">
                                            <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${dotColor(event.type)}`} />
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.title}</p>
                                            {event.body && <p className="text-xs text-slate-500">{event.body}</p>}
                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                {formatDateTime(event.at)}
                                                {event.meta?.by ? ` · ${event.meta.by}` : ''}
                                                {event.meta?.duration ? ` · ${formatDuration(event.meta.duration)}` : ''}
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

function Row({ label, children }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right text-slate-700 dark:text-slate-300">{children}</dd>
        </div>
    );
}

function priorityColor(value, options) {
    return options.priorities.find((p) => p.value === value)?.color || 'slate';
}

function dotColor(type) {
    return { call: 'bg-blue-500', status: 'bg-emerald-500', assignment: 'bg-violet-500' }[type] || 'bg-slate-400';
}
