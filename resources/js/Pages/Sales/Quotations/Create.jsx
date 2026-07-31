import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Field, Input, Select, Textarea } from '@/Components/ui';
import { formatCurrency } from '@/lib/format';

const emptyRow = () => ({ product_id: '', name: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 });

function lineTotal(row) {
    const gross = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
    const net = gross - gross * (Number(row.discount_percent) || 0) / 100;
    const tax = net * (Number(row.tax_percent) || 0) / 100;
    return { gross, net, tax, total: net + tax };
}

export default function QuotationCreate({ leads, products, preselectLead }) {
    const { data, setData, post, processing, errors } = useForm({
        lead_id: preselectLead || '',
        notes: '',
        valid_until: '',
        items: [emptyRow()],
    });

    const setItem = (i, patch) => {
        const items = data.items.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
        setData('items', items);
    };

    const onProduct = (i, productId) => {
        const p = products.find((x) => String(x.id) === String(productId));
        setItem(i, p
            ? { product_id: p.id, name: p.name, unit_price: p.price, tax_percent: p.tax_percent }
            : { product_id: '' });
    };

    const addRow = () => setData('items', [...data.items, emptyRow()]);
    const removeRow = (i) => setData('items', data.items.filter((_, idx) => idx !== i));

    const totals = data.items.reduce(
        (acc, row) => {
            const t = lineTotal(row);
            acc.subtotal += t.gross;
            acc.discount += t.gross - t.net;
            acc.tax += t.tax;
            acc.total += t.total;
            return acc;
        },
        { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );

    const submit = (e) => {
        e.preventDefault();
        post('/quotations');
    };

    return (
        <AuthenticatedLayout header="Sales · New quotation">
            <Head title="New quotation" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">New quotation</h1>

            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card className="p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Lead *" error={errors.lead_id}>
                                <Select value={data.lead_id} onChange={(e) => setData('lead_id', e.target.value)}>
                                    <option value="">Select a lead…</option>
                                    {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>)}
                                </Select>
                            </Field>
                            <Field label="Valid until" error={errors.valid_until}>
                                <Input type="date" value={data.valid_until} onChange={(e) => setData('valid_until', e.target.value)} />
                            </Field>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Line items" action={<Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={addRow}>+ Add item</Button>} />
                        <div className="scrollbar-thin overflow-x-auto px-2 py-2">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-2 py-2">Product / item</th>
                                        <th className="px-2 py-2 w-20">Qty</th>
                                        <th className="px-2 py-2 w-28">Unit</th>
                                        <th className="px-2 py-2 w-24">Disc %</th>
                                        <th className="px-2 py-2 w-24">Tax %</th>
                                        <th className="px-2 py-2 w-28 text-right">Total</th>
                                        <th className="px-2 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((row, i) => (
                                        <tr key={i} className="align-top">
                                            <td className="px-2 py-1">
                                                <Select value={row.product_id} onChange={(e) => onProduct(i, e.target.value)} className="mb-1">
                                                    <option value="">Custom item…</option>
                                                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </Select>
                                                <Input value={row.name} placeholder="Item name" onChange={(e) => setItem(i, { name: e.target.value })} />
                                                {errors[`items.${i}.name`] && <span className="text-xs text-rose-600">{errors[`items.${i}.name`]}</span>}
                                            </td>
                                            <td className="px-2 py-1"><Input type="number" step="0.01" min="0.01" value={row.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} /></td>
                                            <td className="px-2 py-1"><Input type="number" step="0.01" min="0" value={row.unit_price} onChange={(e) => setItem(i, { unit_price: e.target.value })} /></td>
                                            <td className="px-2 py-1"><Input type="number" step="0.01" min="0" max="100" value={row.discount_percent} onChange={(e) => setItem(i, { discount_percent: e.target.value })} /></td>
                                            <td className="px-2 py-1"><Input type="number" step="0.01" min="0" max="100" value={row.tax_percent} onChange={(e) => setItem(i, { tax_percent: e.target.value })} /></td>
                                            <td className="px-2 py-1 pt-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(lineTotal(row).total)}</td>
                                            <td className="px-2 py-1 pt-2 text-center">
                                                {data.items.length > 1 && (
                                                    <button type="button" onClick={() => removeRow(i)} className="text-rose-500 hover:text-rose-700" title="Remove">✕</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {errors.items && <p className="px-4 pb-3 text-xs text-rose-600">{errors.items}</p>}
                    </Card>

                    <Card className="p-5">
                        <Field label="Notes"><Textarea rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Terms, remarks…" /></Field>
                    </Card>
                </div>

                {/* Totals + submit */}
                <div>
                    <Card className="sticky top-20 p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Summary</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
                            <Row label="Discount" value={`- ${formatCurrency(totals.discount)}`} />
                            <Row label="Tax" value={formatCurrency(totals.tax)} />
                            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                                <Row label={<span className="font-semibold">Total</span>} value={<span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.total)}</span>} />
                            </div>
                        </dl>
                        <Button type="submit" disabled={processing} className="mt-4 w-full">{processing ? 'Saving…' : 'Create quotation'}</Button>
                    </Card>
                </div>
            </form>
        </AuthenticatedLayout>
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
