import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Badge, Field, Input, Select, Modal } from '@/Components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function QuotationShow({ quotation, statuses }) {
    const [showConvert, setShowConvert] = useState(false);
    const meta = statuses.find((s) => s.value === quotation.status) || { label: quotation.status, color: 'slate' };
    const isConverted = !!quotation.converted_invoice_id;

    const changeStatus = (v) => router.patch(`/quotations/${quotation.id}/status`, { status: v }, { preserveScroll: true });
    const sendEmail = () => router.post(`/quotations/${quotation.id}/email`, {}, { preserveScroll: true });

    const whatsappLink = () => {
        const phone = (quotation.lead?.phone || '').replace(/[^0-9]/g, '');
        const text = `Hello ${quotation.lead?.name || ''}, here is your quotation ${quotation.quotation_number} for a total of ${formatCurrency(quotation.total)}.`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    };

    return (
        <AuthenticatedLayout header="Sales · Quotation">
            <Head title={quotation.quotation_number} />

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <Link href="/quotations" className="hover:text-indigo-600">Quotations</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300">{quotation.quotation_number}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{quotation.quotation_number}</h2>
                                    <Badge color={meta.color}>{meta.label}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {quotation.lead?.name} · {quotation.lead?.phone}
                                    {quotation.lead?.email ? ` · ${quotation.lead.email}` : ''}
                                </p>
                            </div>
                            {quotation.valid_until && <p className="text-xs text-slate-400">Valid until {formatDate(quotation.valid_until)}</p>}
                        </div>

                        <div className="scrollbar-thin overflow-x-auto px-2 py-2">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2">Item</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Unit</th>
                                        <th className="px-3 py-2 text-right">Disc %</th>
                                        <th className="px-3 py-2 text-right">Tax %</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {quotation.items.map((it) => (
                                        <tr key={it.id} className="text-slate-700 dark:text-slate-300">
                                            <td className="px-3 py-2">{it.name}</td>
                                            <td className="px-3 py-2 text-right">{Number(it.quantity)}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(it.unit_price)}</td>
                                            <td className="px-3 py-2 text-right">{Number(it.discount_percent)}%</td>
                                            <td className="px-3 py-2 text-right">{Number(it.tax_percent)}%</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(it.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {quotation.notes && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500 dark:border-slate-800">{quotation.notes}</p>}
                    </Card>
                </div>

                {/* Actions + totals */}
                <div className="space-y-6">
                    <Card className="p-5">
                        <dl className="space-y-2 text-sm">
                            <Row label="Subtotal" value={formatCurrency(quotation.subtotal)} />
                            <Row label="Discount" value={`- ${formatCurrency(quotation.discount_total)}`} />
                            <Row label="Tax" value={formatCurrency(quotation.tax_total)} />
                            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                                <Row label={<span className="font-semibold">Total</span>} value={<span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(quotation.total)}</span>} />
                            </div>
                        </dl>
                    </Card>

                    <Card className="space-y-3 p-5">
                        <Field label="Status">
                            <Select value={quotation.status} onChange={(e) => changeStatus(e.target.value)} disabled={isConverted}>
                                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </Select>
                        </Field>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={sendEmail} disabled={!quotation.lead?.email} title={quotation.lead?.email ? '' : 'Lead has no email'}>
                                ✉ Email
                            </Button>
                            <Button as="a" variant="secondary" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                                🟢 WhatsApp
                            </Button>
                        </div>

                        {isConverted ? (
                            <Link href={`/invoices/${quotation.converted_invoice_id}`} className="block rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                                View invoice {quotation.invoice?.invoice_number || ''} →
                            </Link>
                        ) : (
                            <Button className="w-full" onClick={() => setShowConvert(true)}>Convert to invoice</Button>
                        )}
                    </Card>
                </div>
            </div>

            <ConvertModal open={showConvert} onClose={() => setShowConvert(false)} quotation={quotation} />
        </AuthenticatedLayout>
    );
}

function ConvertModal({ open, onClose, quotation }) {
    const { data, setData, post, processing, errors } = useForm({
        advance_amount: '',
        issued_at: new Date().toISOString().slice(0, 10),
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/quotations/${quotation.id}/convert`, { onSuccess: onClose });
    };

    const balance = Math.max(0, Number(quotation.total) - (Number(data.advance_amount) || 0));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Convert to invoice"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={processing}>Create invoice</Button></>}
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                    <div className="flex justify-between"><span className="text-slate-500">Invoice total</span><span className="font-semibold">{formatCurrency(quotation.total)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Advance / paid now" error={errors.advance_amount}>
                        <Input type="number" step="0.01" min="0" value={data.advance_amount} onChange={(e) => setData('advance_amount', e.target.value)} placeholder="0.00" />
                    </Field>
                    <Field label="Issue date" error={errors.issued_at}>
                        <Input type="date" value={data.issued_at} onChange={(e) => setData('issued_at', e.target.value)} />
                    </Field>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                    <span className="text-slate-500">Balance due</span><span className="font-semibold">{formatCurrency(balance)}</span>
                </div>
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
