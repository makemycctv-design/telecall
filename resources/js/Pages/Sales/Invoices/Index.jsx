import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Badge, EmptyState, Pagination, Select } from '@/Components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function InvoicesIndex({ invoices, statuses, filters }) {
    const meta = (v) => statuses.find((s) => s.value === v) || { label: v, color: 'slate' };

    return (
        <AuthenticatedLayout header="Sales · Invoices">
            <Head title="Invoices" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Invoices</h1>

            <Card className="mb-4 p-4">
                <Select
                    className="max-w-xs"
                    value={filters.status || ''}
                    onChange={(e) => router.get('/invoices', { status: e.target.value || undefined }, { preserveState: true, replace: true })}
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
            </Card>

            <Card className="overflow-hidden">
                {invoices.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="📄" title="No invoices" description="Convert a quotation to create an invoice." /></div>
                ) : (
                    <div className="scrollbar-thin overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Number</th>
                                    <th className="px-5 py-3 font-medium">Lead</th>
                                    <th className="px-5 py-3 font-medium">Total</th>
                                    <th className="px-5 py-3 font-medium">Advance</th>
                                    <th className="px-5 py-3 font-medium">Balance</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Issued</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.data.map((inv) => (
                                    <tr key={inv.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => router.visit(`/invoices/${inv.id}`)}>
                                        <td className="px-5 py-3 font-medium text-indigo-600">{inv.invoice_number}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-slate-900 dark:text-slate-100">{inv.lead?.name}</p>
                                            <p className="text-xs text-slate-400">{inv.lead?.phone}</p>
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{formatCurrency(inv.total)}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(inv.advance_amount)}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(inv.balance_amount)}</td>
                                        <td className="px-5 py-3"><Badge color={meta(inv.status).color}>{meta(inv.status).label}</Badge></td>
                                        <td className="px-5 py-3 text-slate-500">{inv.issued_at ? formatDate(inv.issued_at) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={invoices.links} /></div>
        </AuthenticatedLayout>
    );
}
