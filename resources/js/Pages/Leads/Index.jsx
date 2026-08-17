import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button, Card, Field, Input, Select, StatusBadge, Badge, EmptyState, Pagination, Modal } from '@/Components/ui';
import { formatDateTime } from '@/lib/format';

export default function LeadsIndex({ leads, filters, options }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [f, setF] = useState({
        search: filters.search || '',
        status: filters.status || '',
        priority: filters.priority || '',
        source_id: filters.source_id || '',
        assigned_to: filters.assigned_to || '',
    });

    const applyFilters = (next = f) => {
        router.get('/leads', Object.fromEntries(Object.entries(next).filter(([, v]) => v)), {
            preserveState: true,
            replace: true,
        });
    };

    const onFilterChange = (key, value) => {
        const next = { ...f, [key]: value };
        setF(next);
        if (key !== 'search') applyFilters(next);
    };

    return (
        <AuthenticatedLayout header="Leads">
            <Head title="Leads" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Leads</h1>
                <Button onClick={() => setShowCreate(true)}>+ New lead</Button>
            </div>

            {/* Filters */}
            <Card className="mb-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                        className="lg:col-span-2"
                    >
                        <Input
                            placeholder="Search name, phone, email…"
                            value={f.search}
                            onChange={(e) => setF({ ...f, search: e.target.value })}
                        />
                    </form>
                    <Select value={f.status} onChange={(e) => onFilterChange('status', e.target.value)}>
                        <option value="">All statuses</option>
                        {options.statuses.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </Select>
                    <Select value={f.priority} onChange={(e) => onFilterChange('priority', e.target.value)}>
                        <option value="">All priorities</option>
                        {options.priorities.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </Select>
                    <Select value={f.assigned_to} onChange={(e) => onFilterChange('assigned_to', e.target.value)}>
                        <option value="">All assignees</option>
                        {options.telecallers.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </Select>
                </div>
            </Card>

            {/* Table (desktop) / Cards (mobile) */}
            <Card className="overflow-hidden">
                {leads.data.length === 0 ? (
                    <div className="p-6">
                        <EmptyState title="No leads found" description="Try adjusting your filters or create a new lead." />
                    </div>
                ) : (
                    <>
                        {/* Desktop table view */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Lead</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 font-medium">Priority</th>
                                        <th className="px-5 py-3 font-medium">Assignee</th>
                                        <th className="px-5 py-3 font-medium">Follow-up</th>
                                        <th className="px-5 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {leads.data.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            onClick={() => router.visit(`/leads/${lead.id}`)}
                                        >
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
                                                <p className="text-xs text-slate-400">{lead.phone}{lead.company ? ` · ${lead.company}` : ''}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={{ label: statusLabel(lead.status, options), color: statusColor(lead.status, options) }} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge color={priorityColor(lead.priority, options)}>{lead.priority}</Badge>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{lead.assignee?.name || '—'}</td>
                                            <td className="px-5 py-3 text-slate-500">{lead.next_follow_up_at ? formatDateTime(lead.next_follow_up_at) : '—'}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingLead(lead);
                                                        }}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Are you sure you want to delete this lead?')) {
                                                                router.delete(`/leads/${lead.id}`);
                                                            }
                                                        }}
                                                        className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                            {leads.data.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    onClick={() => router.visit(`/leads/${lead.id}`)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
                                            <p className="mt-0.5 truncate text-xs text-slate-400">{lead.phone}{lead.company ? ` · ${lead.company}` : ''}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <StatusBadge status={{ label: statusLabel(lead.status, options), color: statusColor(lead.status, options) }} />
                                            <Badge color={priorityColor(lead.priority, options)}>{lead.priority}</Badge>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>{lead.assignee?.name || 'Unassigned'}</span>
                                            {lead.next_follow_up_at && (
                                                <span>📅 {formatDateTime(lead.next_follow_up_at)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingLead(lead);
                                                }}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this lead?')) {
                                                        router.delete(`/leads/${lead.id}`);
                                                    }
                                                }}
                                                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <div className="mt-4 flex justify-center">
                <Pagination links={leads.links} />
            </div>

            <CreateLeadModal open={showCreate} onClose={() => setShowCreate(false)} options={options} />
            <EditLeadModal lead={editingLead} onClose={() => setEditingLead(null)} options={options} />
        </AuthenticatedLayout>
    );
}

function statusLabel(value, options) {
    return options.statuses.find((s) => s.value === value)?.label || value;
}
function statusColor(value, options) {
    return options.statuses.find((s) => s.value === value)?.color || 'slate';
}
function priorityColor(value, options) {
    return options.priorities.find((p) => p.value === value)?.color || 'slate';
}

function CreateLeadModal({ open, onClose, options }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', phone: '', email: '', company: '', city: '',
        priority: 'medium', lead_source_id: '', assigned_to: '', notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/leads', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="New lead"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={processing}>Create lead</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Name *" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <Field label="Phone *" error={errors.phone}>
                        <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <Input value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    </Field>
                    <Field label="Company">
                        <Input value={data.company} onChange={(e) => setData('company', e.target.value)} />
                    </Field>
                    <Field label="Priority">
                        <Select value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                            {options.priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </Select>
                    </Field>
                    <Field label="Source">
                        <Select value={data.lead_source_id} onChange={(e) => setData('lead_source_id', e.target.value)}>
                            <option value="">—</option>
                            {options.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                </div>
                <Field label="Assign to">
                    <Select value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
                        <option value="">Auto-assign</option>
                        {options.telecallers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </Field>
            </form>
        </Modal>
    );
}

function EditLeadModal({ lead, onClose, options }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        email: '',
        company: '',
        city: '',
        priority: 'medium',
        lead_source_id: '',
        assigned_to: '',
        notes: '',
        deal_value: '',
        next_follow_up_at: '',
    });

    const open = !!lead;

    useEffect(() => {
        if (lead) {
            setData({
                name: lead.name || '',
                phone: lead.phone || '',
                email: lead.email || '',
                company: lead.company || '',
                city: lead.city || '',
                priority: lead.priority || 'medium',
                lead_source_id: lead.lead_source_id || '',
                assigned_to: lead.assigned_to || '',
                notes: lead.notes || '',
                deal_value: lead.deal_value || '',
                next_follow_up_at: lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : '',
            });
        }
    }, [lead]);

    const submit = (e) => {
        e.preventDefault();
        patch(`/leads/${lead.id}`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit lead"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={processing}>Save changes</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Name *" error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <Field label="Phone *" error={errors.phone}>
                        <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    </Field>
                    <Field label="Company" error={errors.company}>
                        <Input value={data.company} onChange={(e) => setData('company', e.target.value)} />
                    </Field>
                    <Field label="City" error={errors.city}>
                        <Input value={data.city} onChange={(e) => setData('city', e.target.value)} />
                    </Field>
                    <Field label="Priority" error={errors.priority}>
                        <Select value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                            {options.priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </Select>
                    </Field>
                    <Field label="Source" error={errors.lead_source_id}>
                        <Select value={data.lead_source_id} onChange={(e) => setData('lead_source_id', e.target.value)}>
                            <option value="">—</option>
                            {options.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Assign to" error={errors.assigned_to}>
                        <Select value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
                            <option value="">—</option>
                            {options.telecallers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Deal value" error={errors.deal_value}>
                        <Input type="number" min="0" step="0.01" value={data.deal_value} onChange={(e) => setData('deal_value', e.target.value)} />
                    </Field>
                    <Field label="Next follow-up" error={errors.next_follow_up_at}>
                        <Input type="datetime-local" value={data.next_follow_up_at} onChange={(e) => setData('next_follow_up_at', e.target.value)} />
                    </Field>
                </div>
                <Field label="Notes" error={errors.notes}>
                    <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        rows={3}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </Field>
            </form>
        </Modal>
    );
}
