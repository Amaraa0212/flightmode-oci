import { useSyncExternalStore } from 'react'

/** Light / dark: the class on <html> (set before the first paint in index.html), remembered per browser. */
export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()
const current = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0b1220' : '#f3f6fb')
  try {
    localStorage.setItem('oci-theme', theme)
  } catch {
    // not remembered; the switch still works for this visit
  }
  listeners.forEach((l) => l())
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, current)
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')]
}
