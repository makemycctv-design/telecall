import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, KpiCard, Select, Input, Field, EmptyState, Pagination } from '@/Components/ui';
import { formatCurrency } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CATEGORIES = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
];

export default function ReportsIndex({ report, category, filters, options }) {
    const [f, setF] = useState({
        staff_id: filters.staff_id || '',
        source_id: filters.source_id || '',
        from: filters.from || '',
        to: filters.to || '',
    });

    const query = (extra = {}) => ({ category, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), ...extra });
    const switchCategory = (key) => router.get('/reports', { ...query(), category: key }, { preserveState: true });
    const applyFilters = () => router.get('/reports', query(), { preserveState: true });

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Reports" />
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
                <Button
                    variant="secondary"
                    as="a"
                    href={`/reports/export?${new URLSearchParams(query()).toString()}`}
                >
                    ⬇ Export CSV
                </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => switchCategory(c.key)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                            category === c.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
                        }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <Card className="mb-4 p-3 sm:p-4">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Staff">
                        <Select value={f.staff_id} onChange={(e) => setF({ ...f, staff_id: e.target.value })}>
                            <option value="">All staff</option>
                            {options.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Source">
                        <Select value={f.source_id} onChange={(e) => setF({ ...f, source_id: e.target.value })}>
                            <option value="">All sources</option>
                            {options.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="From"><Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
                    <Field label="To"><Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
                </div>
                <div className="mt-3"><Button onClick={applyFilters}>Apply filters</Button></div>
            </Card>

            {/* Summary cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {report.cards.map((card, i) => (
                    <KpiCard
                        key={i}
                        label={card.label}
                        value={card.format === 'currency' ? formatCurrency(card.value) : card.value}
                    />
                ))}
            </div>

            {/* Chart */}
            {report.series?.length > 0 && (
                <Card className="mb-4 p-3 sm:p-4">
                    <CardHeader title="Breakdown" />
                    <div className="h-48 px-1 py-3 sm:h-64 sm:px-2 sm:py-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={report.series}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Detail table */}
            <Card className="overflow-hidden">
                <CardHeader title="Details" subtitle={`${report.rows.total} record(s)`} />
                {report.rows.data.length === 0 ? (
                    <div className="p-6"><EmptyState title="No records" description="No data for the selected filters." /></div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        {Object.keys(report.rows.data[0])
                                            .filter((k) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(k) && typeof report.rows.data[0][k] !== 'object')
                                            .slice(0, 6)
                                            .map((k) => <th key={k} className="px-4 py-2 font-medium">{k.replaceAll('_', ' ')}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {report.rows.data.map((row) => (
                                        <tr key={row.id} className="text-slate-700 dark:text-slate-300">
                                            {Object.keys(report.rows.data[0])
                                                .filter((k) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(k) && typeof report.rows.data[0][k] !== 'object')
                                                .slice(0, 6)
                                                .map((k) => <td key={k} className="px-4 py-2">{String(row[k] ?? '—')}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                            {report.rows.data.map((row) => {
                                const keys = Object.keys(report.rows.data[0])
                                    .filter((k) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(k) && typeof report.rows.data[0][k] !== 'object')
                                    .slice(0, 6);
                                return (
                                    <div key={row.id} className="space-y-1 p-4">
                                        {keys.map((k) => (
                                            <div key={k} className="flex items-center justify-between gap-2 text-sm">
                                                <span className="text-xs capitalize text-slate-400">{k.replaceAll('_', ' ')}</span>
                                                <span className="text-slate-700 dark:text-slate-300">{String(row[k] ?? '—')}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>

            <div className="mt-4 flex justify-center"><Pagination links={report.rows.links} /></div>
        </AuthenticatedLayout>
    );
}
