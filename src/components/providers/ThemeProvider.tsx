'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with default values to match server-side rendering
  const [theme, setThemeState] = useState<Theme>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only run on client-side after mounting
    setMounted(true)

    // Get initial theme from localStorage or default to system
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    setThemeState(savedTheme)

    // Get initial actualTheme from DOM (set by the script in layout.tsx)
    const currentTheme = document.documentElement.getAttribute('data-theme')
    setActualTheme((currentTheme as 'light' | 'dark') || 'light')
  }, [])

  useEffect(() => {
    // Only update theme after component is mounted to avoid hydration mismatches
    if (!mounted) return

    const updateTheme = () => {
      let resolvedTheme: 'light' | 'dark'

      if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        resolvedTheme = theme
      }

      setActualTheme(resolvedTheme)
      document.documentElement.setAttribute('data-theme', resolvedTheme)
      localStorage.setItem('theme', theme)
    }

    updateTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}