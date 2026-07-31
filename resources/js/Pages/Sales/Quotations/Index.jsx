import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, EmptyState, Pagination, Select } from '@/Components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function QuotationsIndex({ quotations, statuses, filters }) {
    const meta = (v) => statuses.find((s) => s.value === v) || { label: v, color: 'slate' };

    return (
        <AuthenticatedLayout header="Sales · Quotations">
            <Head title="Quotations" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quotations</h1>
                <Button as={Link} href="/quotations/create">+ New quotation</Button>
            </div>

            <Card className="mb-4 p-4">
                <Select
                    className="max-w-xs"
                    value={filters.status || ''}
                    onChange={(e) => router.get('/quotations', { status: e.target.value || undefined }, { preserveState: true, replace: true })}
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
            </Card>

            <Card className="overflow-hidden">
                {quotations.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="🧾" title="No quotations" description="Create a quotation for a lead to get started." /></div>
                ) : (
                    <div className="scrollbar-thin overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Number</th>
                                    <th className="px-5 py-3 font-medium">Lead</th>
                                    <th className="px-5 py-3 font-medium">Total</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Valid until</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {quotations.data.map((q) => (
                                    <tr key={q.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => router.visit(`/quotations/${q.id}`)}>
                                        <td className="px-5 py-3 font-medium text-indigo-600">{q.quotation_number}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-slate-900 dark:text-slate-100">{q.lead?.name}</p>
                                            <p className="text-xs text-slate-400">{q.lead?.phone}</p>
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{formatCurrency(q.total)}</td>
                                        <td className="px-5 py-3"><Badge color={meta(q.status).color}>{meta(q.status).label}</Badge></td>
                                        <td className="px-5 py-3 text-slate-500">{q.valid_until ? formatDate(q.valid_until) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={quotations.links} /></div>
        </AuthenticatedLayout>
    );
}
