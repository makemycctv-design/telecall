// Lightweight dark-mode controller backed by localStorage + OS preference.

const STORAGE_KEY = 'telecrm-theme';

export function applyStoredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
}

export function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    return isDark;
}

export function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}
