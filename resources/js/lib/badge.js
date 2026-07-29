// Maps a colour token (emitted by PHP enums) to Tailwind badge classes.
// Kept as full class strings so Tailwind's JIT can detect them.

export const BADGE_COLORS = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    blue: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900',
    amber: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    rose: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    violet: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900',
    emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
};

export function badgeClass(color) {
    return BADGE_COLORS[color] || BADGE_COLORS.slate;
}
