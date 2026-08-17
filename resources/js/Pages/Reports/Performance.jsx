import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, KpiCard, Button, Input, Field, EmptyState } from '@/Components/ui';
import { formatDuration } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Performance({ byStaff, trend, totals, range }) {
    const [r, setR] = useState({ from: range.from, to: range.to });
    const apply = () => router.get('/performance', r, { preserveState: true });

    return (
        <AuthenticatedLayout header="Performance">
            <Head title="Performance" />
            <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Staff performance</h1>

            <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <Field label="From"><Input type="date" value={r.from} onChange={(e) => setR({ ...r, from: e.target.value })} /></Field>
                    <Field label="To"><Input type="date" value={r.to} onChange={(e) => setR({ ...r, to: e.target.value })} /></Field>
                    <Button onClick={apply}>Apply</Button>
                </div>
            </Card>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Calls made" value={totals.calls_made} />
                <KpiCard label="Talk time" value={formatDuration(totals.talk_time_seconds)} />
                <KpiCard label="Follow-ups" value={totals.follow_ups} />
                <KpiCard label="Converted" value={totals.converted} tone="good" />
            </div>

            <Card className="mb-4 p-4">
                <CardHeader title="Activity trend" />
                <div className="h-64 px-2 py-4">
                    {trend.length === 0 ? (
                        <EmptyState title="No data" description="No metrics in this range yet." />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="calls" stroke="#4f46e5" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="converted" stroke="#059669" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader title="By staff member" />
                {byStaff.length === 0 ? (
                    <div className="p-6"><EmptyState title="No staff metrics" description="Metrics are aggregated hourly and nightly." /></div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block scrollbar-thin overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Staff</th>
                                        <th className="px-4 py-2 font-medium">Calls</th>
                                        <th className="px-4 py-2 font-medium">Connect %</th>
                                        <th className="px-4 py-2 font-medium">Talk time</th>
                                        <th className="px-4 py-2 font-medium">Follow-ups</th>
                                        <th className="px-4 py-2 font-medium">Interested</th>
                                        <th className="px-4 py-2 font-medium">Converted</th>
                                        <th className="px-4 py-2 font-medium">Overdue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {byStaff.map((s) => (
                                        <tr key={s.user_id} className="text-slate-700 dark:text-slate-300">
                                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                                            <td className="px-4 py-2">{s.calls_made}</td>
                                            <td className="px-4 py-2">{s.connect_rate}%</td>
                                            <td className="px-4 py-2">{formatDuration(s.talk_time_seconds)}</td>
                                            <td className="px-4 py-2">{s.follow_ups_completed}</td>
                                            <td className="px-4 py-2">{s.leads_interested}</td>
                                            <td className="px-4 py-2 font-semibold text-emerald-600">{s.leads_converted}</td>
                                            <td className={`px-4 py-2 ${s.tasks_overdue ? 'text-rose-600' : ''}`}>{s.tasks_overdue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                            {byStaff.map((s) => (
                                <div key={s.user_id} className="p-4 space-y-2">
                                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{s.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <div className="flex justify-between"><span className="text-slate-500">Calls</span><span className="font-medium text-slate-700 dark:text-slate-300">{s.calls_made}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Connect</span><span className="font-medium text-slate-700 dark:text-slate-300">{s.connect_rate}%</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Talk time</span><span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(s.talk_time_seconds)}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Follow-ups</span><span className="font-medium text-slate-700 dark:text-slate-300">{s.follow_ups_completed}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Interested</span><span className="font-medium text-slate-700 dark:text-slate-300">{s.leads_interested}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Converted</span><span className="font-semibold text-emerald-600">{s.leads_converted}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Overdue</span><span className={`font-medium ${s.tasks_overdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{s.tasks_overdue}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
