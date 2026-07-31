import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Field, Input, Modal } from '@/Components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function InvoiceShow({ invoice, statuses }) {
    const [showPay, setShowPay] = useState(false);
    const meta = statuses.find((s) => s.value === invoice.status) || { label: invoice.status, color: 'slate' };
    const paid = invoice.status === 'paid';

    return (
        <AuthenticatedLayout header="Sales · Invoice">
            <Head title={invoice.invoice_number} />

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <Link href="/invoices" className="hover:text-indigo-600">Invoices</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300">{invoice.invoice_number}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{invoice.invoice_number}</h2>
                                    <Badge color={meta.color}>{meta.label}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {invoice.lead?.name} · {invoice.lead?.phone}
                                    {invoice.quotation ? ` · from ${invoice.quotation.quotation_number}` : ''}
                                </p>
                            </div>
                            {invoice.issued_at && <p className="text-xs text-slate-400">Issued {formatDate(invoice.issued_at)}</p>}
                        </div>

                        <div className="scrollbar-thin overflow-x-auto px-2 py-2">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2">Item</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Unit</th>
                                        <th className="px-3 py-2 text-right">Disc %</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invoice.items.map((it) => (
                                        <tr key={it.id} className="text-slate-700 dark:text-slate-300">
                                            <td className="px-3 py-2">{it.name}</td>
                                            <td className="px-3 py-2 text-right">{Number(it.quantity)}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(it.unit_price)}</td>
                                            <td className="px-3 py-2 text-right">{Number(it.discount_percent)}%</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(it.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-5">
                        <dl className="space-y-2 text-sm">
                            <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                            <Row label="Discount" value={`- ${formatCurrency(invoice.discount_total)}`} />
                            <Row label="Tax" value={formatCurrency(invoice.tax_total)} />
                            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                                <Row label={<span className="font-semibold">Total</span>} value={<span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(invoice.total)}</span>} />
                            </div>
                            <Row label="Advance / paid" value={<span className="text-emerald-600">{formatCurrency(invoice.advance_amount)}</span>} />
                            <Row label="Balance due" value={<span className={invoice.balance_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(invoice.balance_amount)}</span>} />
                        </dl>
                        {!paid && <Button className="mt-4 w-full" onClick={() => setShowPay(true)}>Record payment</Button>}
                    </Card>
                </div>
            </div>

            <PaymentModal open={showPay} onClose={() => setShowPay(false)} invoice={invoice} />
        </AuthenticatedLayout>
    );
}

function PaymentModal({ open, onClose, invoice }) {
    const { data, setData, post, processing, errors } = useForm({ amount: '' });

    const submit = (e) => {
        e.preventDefault();
        post(`/invoices/${invoice.id}/payment`, { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Record payment"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={processing}>Save payment</Button></>}
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                    <span className="text-slate-500">Balance due</span><span className="font-semibold">{formatCurrency(invoice.balance_amount)}</span>
                </div>
                <Field label="Amount received *" error={errors.amount}>
                    <Input type="number" step="0.01" min="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} autoFocus />
                </Field>
            </form>
        </Modal>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-slate-700 dark:text-slate-300">{value}</dd>
        </div>
    );
}
