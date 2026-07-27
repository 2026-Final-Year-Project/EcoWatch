'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-lg shadow-sm transition hover:scale-105 dark:border-white/15 dark:bg-white/10 ${className}`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
    </button>
  )
}
