import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Badge, Field, Input, Select, Modal, Avatar, Pagination, EmptyState } from '@/Components/ui';

export default function StaffIndex({ staff, roles, managers }) {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <AuthenticatedLayout header="Staff management">
            <Head title="Staff" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Staff</h1>
                <Button onClick={() => setShowCreate(true)}>+ Add staff</Button>
            </div>

            <Card className="overflow-hidden">
                {staff.data.length === 0 ? (
                    <div className="p-6"><EmptyState title="No staff" description="Add your first team member." /></div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Name</th>
                                        <th className="px-5 py-3 font-medium">Roles</th>
                                        <th className="px-5 py-3 font-medium">Leads</th>
                                        <th className="px-5 py-3 font-medium">Calls</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {staff.data.map((u) => (
                                        <tr key={u.id}>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={u.name} size="sm" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="flex flex-wrap gap-1">
                                                    {u.roles.map((r) => <Badge key={r.id} color="blue">{r.slug}</Badge>)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.assigned_leads_count}</td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.call_logs_count}</td>
                                            <td className="px-5 py-3">
                                                <Badge color={u.is_active ? 'emerald' : 'rose'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => router.patch(`/staff/${u.id}`, { is_active: !u.is_active }, { preserveScroll: true })}
                                                    className="text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                            {staff.data.map((u) => (
                                <div key={u.id} className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={u.name} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                                            <p className="truncate text-xs text-slate-400">{u.email}</p>
                                        </div>
                                        <Badge color={u.is_active ? 'emerald' : 'rose'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            {u.roles.map((r) => <Badge key={r.id} color="blue">{r.slug}</Badge>)}
                                            <span>{u.assigned_leads_count} leads</span>
                                            <span>{u.call_logs_count} calls</span>
                                        </div>
                                        <button
                                            onClick={() => router.patch(`/staff/${u.id}`, { is_active: !u.is_active }, { preserveScroll: true })}
                                            className="text-xs font-medium text-indigo-600 hover:underline"
                                        >
                                            {u.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={staff.links} /></div>

            <CreateStaffModal open={showCreate} onClose={() => setShowCreate(false)} roles={roles} managers={managers} />
        </AuthenticatedLayout>
    );
}

function CreateStaffModal({ open, onClose, roles, managers }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', phone: '', password: '', role: 'telecaller', manager_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/staff', { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add staff member"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={processing}>Create</Button></>}
        >
            <form onSubmit={submit} className="space-y-3">
                <Field label="Name *" error={errors.name}><Input value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                <Field label="Email *" error={errors.email}><Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Phone"><Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></Field>
                    <Field label="Password *" error={errors.password}><Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Role">
                        <Select value={data.role} onChange={(e) => setData('role', e.target.value)}>
                            {roles.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Manager">
                        <Select value={data.manager_id} onChange={(e) => setData('manager_id', e.target.value)}>
                            <option value="">—</option>
                            {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Select>
                    </Field>
                </div>
            </form>
        </Modal>
    );
}
