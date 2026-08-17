import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardHeader, Button, Field, Input } from '@/Components/ui';

export default function ProfileEdit({ user }) {
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.patch('/profile', { preserveScroll: true });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch('/profile', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout header="My Profile">
            <Head title="Profile" />
            <div className="mx-auto max-w-2xl space-y-6">
                {/* Profile Information */}
                <Card className="p-6">
                    <CardHeader title="Profile Information" subtitle="Update your name, email and phone number." />
                    <form onSubmit={submitProfile} className="mt-4 space-y-4">
                        <Field label="Name" error={profileForm.errors.name}>
                            <Input
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                            />
                        </Field>
                        <Field label="Email" error={profileForm.errors.email}>
                            <Input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                            />
                        </Field>
                        <Field label="Phone" error={profileForm.errors.phone}>
                            <Input
                                value={profileForm.data.phone}
                                onChange={(e) => profileForm.setData('phone', e.target.value)}
                            />
                        </Field>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={profileForm.processing}>
                                {profileForm.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Change Password */}
                <Card className="p-6">
                    <CardHeader title="Change Password" subtitle="Use a strong password to keep your account secure." />
                    <form onSubmit={submitPassword} className="mt-4 space-y-4">
                        <Field label="Current Password" error={passwordForm.errors.current_password}>
                            <Input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                            />
                        </Field>
                        <Field label="New Password" error={passwordForm.errors.password}>
                            <Input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                placeholder="Min 8 characters"
                            />
                        </Field>
                        <Field label="Confirm New Password" error={passwordForm.errors.password_confirmation}>
                            <Input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            />
                        </Field>
                        {passwordForm.data.password && passwordForm.data.password_confirmation && passwordForm.data.password !== passwordForm.data.password_confirmation && (
                            <p className="text-xs text-rose-600">Passwords do not match</p>
                        )}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={passwordForm.processing || !passwordForm.data.current_password || !passwordForm.data.password}>
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
