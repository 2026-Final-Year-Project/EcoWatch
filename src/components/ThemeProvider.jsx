'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'ecowatch-theme'

export default function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const frame = window.requestAnimationFrame(() => {
      setDarkMode(savedTheme ? savedTheme === 'dark' : prefersDark)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
    window.localStorage.setItem(STORAGE_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme: () => setDarkMode((current) => !current) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider')
  return theme
}
