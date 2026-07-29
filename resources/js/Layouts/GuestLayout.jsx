export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
            <div className="w-full max-w-md">
                <div className="mb-6 flex items-center justify-center gap-2 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl">☎</span>
                    <span className="text-2xl font-bold">TeleCRM</span>
                </div>
                <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">{children}</div>
                <p className="mt-6 text-center text-xs text-slate-400">
                    Telecalling CRM · Lead, call & task management
                </p>
            </div>
        </div>
    );
}
