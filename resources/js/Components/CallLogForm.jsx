import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button, Field, Select, Textarea, Input } from '@/Components/ui';

// Logs a call via native fetch so the service worker can queue it for
// background-sync when offline (the SW returns 202 for queued requests).
export default function CallLogForm({ lead, outcomes }) {
    const [form, setForm] = useState({ outcome: 'connected', notes: '', next_follow_up_at: '', duration_seconds: '' });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content
        || decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '');

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);

        const payload = {
            lead_id: lead.id,
            client_uuid: crypto.randomUUID(),
            outcome: form.outcome,
            notes: form.notes || null,
            duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
            next_follow_up_at: form.next_follow_up_at || null,
        };

        try {
            const res = await fetch('/call-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrf(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (res.status === 202) {
                setMessage({ type: 'queued', text: 'Saved offline — will sync when reconnected.' });
            } else if (res.ok) {
                setMessage({ type: 'ok', text: 'Call logged.' });
                router.reload({ only: ['lead', 'timeline'] });
            } else {
                setMessage({ type: 'err', text: 'Could not save the call.' });
            }
            setForm({ outcome: 'connected', notes: '', next_follow_up_at: '', duration_seconds: '' });
        } catch {
            setMessage({ type: 'queued', text: 'Saved offline — will sync when reconnected.' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="Outcome">
                    <Select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
                        {outcomes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </Field>
                <Field label="Duration (sec)">
                    <Input type="number" min="0" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} />
                </Field>
            </div>
            <Field label="Next follow-up">
                <Input type="datetime-local" value={form.next_follow_up_at} onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })} />
            </Field>
            <Field label="Notes">
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Log call'}</Button>
                {message && (
                    <span className={`text-xs ${message.type === 'err' ? 'text-rose-600' : message.type === 'queued' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {message.text}
                    </span>
                )}
            </div>
        </form>
    );
}
