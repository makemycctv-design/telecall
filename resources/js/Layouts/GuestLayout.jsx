export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-3 py-6 sm:px-4">
            <div className="w-full max-w-md">
                <div className="mb-4 flex items-center justify-center gap-2 text-white sm:mb-6">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg sm:h-10 sm:w-10 sm:text-xl">☎</span>
                    <span className="text-xl font-bold sm:text-2xl">TeleCRM</span>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-8">{children}</div>
                <p className="mt-4 text-center text-xs text-slate-400 sm:mt-6">
                    Telecalling CRM · Lead, call & task management
                </p>
            </div>
        </div>
    );
}
