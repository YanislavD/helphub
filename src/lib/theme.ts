import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'helphub-theme'
const listeners = new Set<() => void>()

function readTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark' // dark is the default
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

/** Call once before React renders so there is no flash of the wrong theme. */
export function initTheme() {
  applyTheme(readTheme())
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    readTheme,
    () => 'dark' as Theme,
  )

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode: theme just won't persist */
    }
    applyTheme(next)
    listeners.forEach((l) => l())
  }, [])

  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
