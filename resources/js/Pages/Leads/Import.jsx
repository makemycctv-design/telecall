import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Field } from '@/Components/ui';

export default function LeadsImport() {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null,
        auto_assign: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/import', { forceFormData: true });
    };

    return (
        <AuthenticatedLayout header="Import leads">
            <Head title="Import leads" />
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Import leads</h1>

                <Card>
                    <CardHeader title="Upload CSV" subtitle="Leads are de-duplicated by phone number" />
                    <form onSubmit={submit} className="space-y-4 px-5 py-4">
                        <Field label="CSV file" error={errors.file}>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setData('file', e.target.files[0])}
                                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500 dark:text-slate-300"
                            />
                        </Field>

                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={data.auto_assign}
                                onChange={(e) => setData('auto_assign', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            Auto-assign imported leads to telecallers
                        </label>

                        {progress && (
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-indigo-600" style={{ width: `${progress.percentage}%` }} />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing || !data.file}>
                                {processing ? 'Importing…' : 'Import leads'}
                            </Button>
                            <a href="/import/template" className="text-sm font-medium text-indigo-600 hover:underline">
                                Download template
                            </a>
                        </div>
                    </form>
                </Card>

                <Card className="p-5 text-sm text-slate-500">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Expected columns</p>
                    <p className="mt-1">
                        <code>name</code>, <code>phone</code> (required), plus optional <code>email</code>, <code>company</code>,{' '}
                        <code>city</code>, <code>source</code>, <code>priority</code>, <code>notes</code>.
                    </p>
                    <p className="mt-2">Files with more than 200 rows are processed in the background.</p>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
