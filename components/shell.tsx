'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LayoutDashboard, ListVideo, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-8', className)} aria-hidden>
      <path fill="#0066da" d="M6 15a3 3 0 0 1 3-3h18v9H6z" />
      <path fill="#e94235" d="M27 12l8 8h-8z" />
      <path fill="#2684fc" d="M6 21h21v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" />
      <path fill="#00ac47" d="M35 20l7-5.5v19L35 28z" />
      <path fill="#ffba00" d="M27 12v9h8z" />
    </svg>
  )
}

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/sessions', label: 'Sessions', icon: ListVideo },
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)

function AccountMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!user) return null
  const initial = user.name.trim().charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring grid size-9 place-items-center overflow-hidden rounded-full bg-blue text-sm font-medium text-blue-on"
        aria-label="Account"
        aria-expanded={open}
      >
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-3xl border border-line-subtle bg-surface p-3 shadow-[var(--shadow)]">
          <div className="px-3 py-2 text-center">
            <div className="truncate text-sm font-medium text-ink">{user.name}</div>
            <div className="truncate text-xs text-ink-3">{user.email}</div>
          </div>
          <button
            onClick={signOut}
            className="focus-ring mt-1 flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-2 hover:bg-surface-2"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-bg/90 px-4 backdrop-blur sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-full pr-3">
          <Logo />
          <span className="text-[22px] leading-none text-ink-2">
            <span className="hidden sm:inline">Meet </span>Engagement
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>

      <div className="flex">
        <nav aria-label="Primary" className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-20 shrink-0 flex-col items-center gap-3 pt-2 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link key={href} href={href} className="focus-ring group flex w-16 flex-col items-center gap-1 rounded-2xl py-1" aria-current={active ? 'page' : undefined}>
                <span className={cn('grid h-8 w-14 place-items-center rounded-full transition-colors', active ? 'bg-blue-tonal text-blue-tonal-ink' : 'text-ink-2 group-hover:bg-surface-2')}>
                  <Icon className="size-5" />
                </span>
                <span className={cn('text-xs', active ? 'font-medium text-ink' : 'text-ink-2')}>{label}</span>
              </Link>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 pt-2 pb-28 sm:px-6 md:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line-subtle bg-surface/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link key={href} href={href} className="focus-ring flex flex-1 flex-col items-center gap-1 rounded-2xl py-1" aria-current={active ? 'page' : undefined}>
              <span className={cn('grid h-8 w-16 place-items-center rounded-full', active ? 'bg-blue-tonal text-blue-tonal-ink' : 'text-ink-2')}>
                <Icon className="size-5" />
              </span>
              <span className={cn('text-xs', active ? 'font-medium text-ink' : 'text-ink-2')}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
