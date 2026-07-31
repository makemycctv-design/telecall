import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Field, Input, Select, Textarea, Modal, EmptyState, Pagination } from '@/Components/ui';
import { formatCurrency } from '@/lib/format';

export default function Products({ products, categories, filters }) {
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState(filters.search || '');

    const applySearch = (e) => {
        e.preventDefault();
        router.get('/products', { search, category_id: filters.category_id || undefined }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout header="Sales · Products">
            <Head title="Products" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Products</h1>
                <Button onClick={() => setModal({})}>+ New product</Button>
            </div>

            <Card className="mb-4 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <form onSubmit={applySearch} className="sm:col-span-2">
                        <Input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </form>
                    <Select
                        value={filters.category_id || ''}
                        onChange={(e) => router.get('/products', { search: search || undefined, category_id: e.target.value || undefined }, { preserveState: true, replace: true })}
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
            </Card>

            <Card className="overflow-hidden">
                {products.data.length === 0 ? (
                    <div className="p-6"><EmptyState icon="📦" title="No products" description="Add products to use them in quotations." /></div>
                ) : (
                    <div className="scrollbar-thin overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Product</th>
                                    <th className="px-5 py-3 font-medium">Category</th>
                                    <th className="px-5 py-3 font-medium">Price</th>
                                    <th className="px-5 py-3 font-medium">Tax %</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {products.data.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                                            {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.category?.name || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(p.price)}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.tax_percent}%</td>
                                        <td className="px-5 py-3"><Badge color={p.is_active ? 'emerald' : 'rose'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => setModal(p)} className="text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                                                <button
                                                    onClick={() => window.confirm(`Delete ${p.name}?`) && router.delete(`/products/${p.id}`, { preserveScroll: true })}
                                                    className="text-xs font-medium text-rose-600 hover:underline"
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
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={products.links} /></div>

            <ProductModal product={modal} categories={categories} onClose={() => setModal(null)} />
        </AuthenticatedLayout>
    );
}

function ProductModal({ product, categories, onClose }) {
    const isEdit = product && product.id;
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        category_id: '', name: '', sku: '', description: '', price: '', tax_percent: '0', is_active: true,
    });

    useEffect(() => {
        if (product) {
            setData({
                category_id: product.category_id || '',
                name: product.name || '',
                sku: product.sku || '',
                description: product.description || '',
                price: product.price ?? '',
                tax_percent: product.tax_percent ?? '0',
                is_active: product.is_active ?? true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, !!product]);

    if (!product) return null;

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        isEdit ? patch(`/products/${product.id}`, opts) : post('/products', opts);
    };

    return (
        <Modal
            open={!!product}
            onClose={onClose}
            title={isEdit ? 'Edit product' : 'New product'}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={processing}>Save</Button></>}
        >
            <form onSubmit={submit} className="space-y-3">
                <Field label="Name *" error={errors.name}><Input value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                        <Select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}>
                            <option value="">—</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="SKU"><Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} /></Field>
                    <Field label="Price *" error={errors.price}><Input type="number" step="0.01" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} /></Field>
                    <Field label="Tax %" error={errors.tax_percent}><Input type="number" step="0.01" min="0" max="100" value={data.tax_percent} onChange={(e) => setData('tax_percent', e.target.value)} /></Field>
                </div>
                <Field label="Description"><Textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} /></Field>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    Active
                </label>
            </form>
        </Modal>
    );
}
