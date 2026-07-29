import { useState } from 'react';
import { toggleTheme, isDarkMode } from '@/theme';

export default function ThemeToggle() {
    const [dark, setDark] = useState(isDarkMode());

    return (
        <button
            onClick={() => setDark(toggleTheme())}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
            title="Toggle theme"
        >
            {dark ? '☀️' : '🌙'}
        </button>
    );
}
