// Reusable, Tailwind-styled UI primitives for the CRM.
import { Link } from '@inertiajs/react';
import { badgeClass } from '@/lib/badge';
import { initials } from '@/lib/format';

function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}

// ---- Button --------------------------------------------------------------

const BUTTON_VARIANTS = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
    secondary:
        'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
};

export function Button({ variant = 'primary', className, as: As = 'button', ...props }) {
    return (
        <As
            className={cx(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                BUTTON_VARIANTS[variant],
                className,
            )}
            {...props}
        />
    );
}

// ---- Card ----------------------------------------------------------------

export function Card({ className, children }) {
    return (
        <div
            className={cx(
                'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

// ---- Badge ---------------------------------------------------------------

export function Badge({ color = 'slate', children }) {
    return (
        <span
            className={cx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset',
                badgeClass(color),
            )}
        >
            {children}
        </span>
    );
}

export function StatusBadge({ status }) {
    if (!status) return null;
    return <Badge color={status.color}>{status.label}</Badge>;
}

// ---- Form controls -------------------------------------------------------

export function Field({ label, error, children, className }) {
    return (
        <label className={cx('block', className)}>
            {label && <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>}
            {children}
            {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
        </label>
    );
}

const CONTROL =
    'w-full rounded-lg border-0 bg-white px-3 py-2.5 text-base text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700';

export function Input({ className, ...props }) {
    return <input className={cx(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
    return <textarea className={cx(CONTROL, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
    return (
        <select className={cx(CONTROL, className)} {...props}>
            {children}
        </select>
    );
}

// ---- Feedback states -----------------------------------------------------

export function Spinner({ className }) {
    return (
        <svg className={cx('h-5 w-5 animate-spin text-indigo-600', className)} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

export function EmptyState({ title, description, action, icon = '📭' }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
            <div className="text-3xl">{icon}</div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ---- KPI card ------------------------------------------------------------

export function KpiCard({ label, value, hint, tone = 'default', href }) {
    const tones = {
        default: 'text-slate-900 dark:text-slate-100',
        good: 'text-emerald-600',
        warn: 'text-amber-600',
        bad: 'text-rose-600',
    };

    const content = (
        <>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className={cx('mt-1 text-3xl font-semibold', tones[tone])}>{value}</p>
            {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
        </>
    );

    if (href) {
        return (
            <Link href={href} className="block rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-600 cursor-pointer">
                {content}
            </Link>
        );
    }

    return (
        <Card className="px-5 py-4">
            {content}
        </Card>
    );
}

// ---- Avatar --------------------------------------------------------------

export function Avatar({ name, size = 'md' }) {
    const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };
    return (
        <span
            className={cx(
                'inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
                sizes[size],
            )}
        >
            {initials(name)}
        </span>
    );
}

// ---- Pagination (Laravel paginator links) --------------------------------

export function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return (
        <nav className="flex flex-wrap items-center gap-1">
            {links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url || '#'}
                    preserveScroll
                    className={cx(
                        'min-w-9 rounded-md px-3 py-1.5 text-center text-sm',
                        link.active
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                        !link.url && 'pointer-events-none opacity-40',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}

// ---- Modal ---------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                        ✕
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
                {footer && (
                    <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
