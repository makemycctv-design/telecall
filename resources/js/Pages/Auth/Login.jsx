import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Field, Input } from '@/Components/ui';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayout>
            <Head title="Sign in" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Welcome back</h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">Sign in to your CRM account.</p>

            <form onSubmit={submit} className="space-y-4">
                <Field label="Email" error={errors.email}>
                    <Input
                        type="email"
                        value={data.email}
                        autoFocus
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </Field>
                <Field label="Password" error={errors.password}>
                    <Input
                        type="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    Remember me
                </label>
                <Button type="submit" disabled={processing} className="w-full">
                    {processing ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>

            <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50">
                <p className="font-medium text-slate-600 dark:text-slate-300">Demo accounts (password: <code>password</code>)</p>
                <p>admin@telecrm.test · manager@telecrm.test · telecaller@telecrm.test</p>
            </div>
        </GuestLayout>
    );
}
