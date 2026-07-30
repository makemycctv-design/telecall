import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Modal, Button, Field, Input, Select, Textarea } from '@/Components/ui';
import { formatCurrency } from '@/lib/format';

// Manager assigns a converted lead to an Executor as a project.
export default function AssignProjectModal({ open, onClose, lead, executors = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        lead_id: lead?.id || '',
        assigned_to: '',
        title: '',
        description: '',
        start_date: new Date().toISOString().slice(0, 10),
        duration_days: '',
        deadline: '',
    });

    // Prefill a sensible title whenever the target lead changes.
    useEffect(() => {
        if (lead) {
            setData((d) => ({
                ...d,
                lead_id: lead.id,
                title: `Onboarding — ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead?.id]);

    if (!lead) return null;

    const submit = (e) => {
        e.preventDefault();
        post('/projects', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Assign to Executor"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={processing}>Assign project</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
                    <p className="text-xs text-slate-500">
                        {lead.phone}{lead.company ? ` · ${lead.company}` : ''}
                        {lead.deal_value ? ` · ${formatCurrency(lead.deal_value)}` : ''}
                    </p>
                </div>

                <Field label="Executor *" error={errors.assigned_to}>
                    <Select value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
                        <option value="">Select an executor…</option>
                        {executors.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </Select>
                </Field>

                <Field label="Project title *" error={errors.title}>
                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                </Field>

                <Field label="Work to be completed" error={errors.description}>
                    <Textarea rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)}
                        placeholder="Describe the deliverables / scope of work…" />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                    <Field label="Start date">
                        <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                    </Field>
                    <Field label="Days to complete" error={errors.duration_days}>
                        <Input type="number" min="1" value={data.duration_days}
                            onChange={(e) => setData('duration_days', e.target.value)} placeholder="e.g. 7" />
                    </Field>
                    <Field label="or Deadline">
                        <Input type="date" value={data.deadline} onChange={(e) => setData('deadline', e.target.value)} />
                    </Field>
                </div>
                <p className="text-xs text-slate-400">Provide a number of days <em>or</em> an explicit deadline.</p>
            </form>
        </Modal>
    );
}
