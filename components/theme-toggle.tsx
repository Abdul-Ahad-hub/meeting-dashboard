'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { THEME_KEY as KEY } from '@/lib/theme'

/** Deliberately understated: a small, low-contrast icon that brightens on hover. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem(KEY, next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      className="focus-ring grid size-9 place-items-center rounded-full text-ink-3 opacity-60 transition hover:bg-surface-2 hover:text-ink hover:opacity-100"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
