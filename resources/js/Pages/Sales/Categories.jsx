import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Field, Input, Textarea, Modal, EmptyState } from '@/Components/ui';

export default function Categories({ categories }) {
    const [modal, setModal] = useState(null); // null | {} (new) | category (edit)

    return (
        <AuthenticatedLayout header="Sales · Categories">
            <Head title="Categories" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categories</h1>
                <Button onClick={() => setModal({})}>+ New category</Button>
            </div>

            <Card className="overflow-hidden">
                {categories.length === 0 ? (
                    <div className="p-6"><EmptyState icon="🏷️" title="No categories" description="Create your first product category." /></div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categories.map((c) => (
                            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                                    {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                                </div>
                                <span className="text-xs text-slate-400">{c.products_count} products</span>
                                <Badge color={c.is_active ? 'emerald' : 'rose'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                                <button onClick={() => setModal(c)} className="text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                                <button
                                    onClick={() => window.confirm(`Delete ${c.name}?`) && router.delete(`/categories/${c.id}`, { preserveScroll: true })}
                                    className="text-xs font-medium text-rose-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <CategoryModal category={modal} onClose={() => setModal(null)} />
        </AuthenticatedLayout>
    );
}

function CategoryModal({ category, onClose }) {
    const isEdit = category && category.id;
    const { data, setData, post, patch, processing, errors, reset } = useForm({ name: '', description: '', is_active: true });

    useEffect(() => {
        if (category) {
            setData({ name: category.name || '', description: category.description || '', is_active: category.is_active ?? true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category?.id, !!category]);

    if (!category) return null;

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        isEdit ? patch(`/categories/${category.id}`, opts) : post('/categories', opts);
    };

    return (
        <Modal
            open={!!category}
            onClose={onClose}
            title={isEdit ? 'Edit category' : 'New category'}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={processing}>Save</Button></>}
        >
            <form onSubmit={submit} className="space-y-3">
                <Field label="Name *" error={errors.name}><Input value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                <Field label="Description" error={errors.description}><Textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} /></Field>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    Active
                </label>
            </form>
        </Modal>
    );
}
