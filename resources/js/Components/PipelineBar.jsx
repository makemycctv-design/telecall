import { Card, CardHeader } from '@/Components/ui';
import { badgeClass } from '@/lib/badge';

// Horizontal stacked pipeline summary: one segment per lead status.
export default function PipelineBar({ pipeline = [] }) {
    const total = pipeline.reduce((sum, s) => sum + s.count, 0) || 1;

    const barColor = {
        slate: 'bg-slate-400',
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        violet: 'bg-violet-500',
        emerald: 'bg-emerald-500',
    };

    return (
        <Card>
            <CardHeader title="Lead pipeline" subtitle={`${total} leads`} />
            <div className="px-5 py-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    {pipeline.map((s) => (
                        <div
                            key={s.status}
                            className={barColor[s.color] || 'bg-slate-400'}
                            style={{ width: `${(s.count / total) * 100}%` }}
                            title={`${s.label}: ${s.count}`}
                        />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {pipeline.map((s) => (
                        <div key={s.status} className="flex items-center justify-between rounded-lg px-2 py-1">
                            <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium ${badgeClass(s.color).split(' ').slice(1, 2).join(' ')}`}
                            >
                                <span className={`h-2 w-2 rounded-full ${barColor[s.color]}`} />
                                {s.label}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
