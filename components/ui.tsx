import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import type { Tone } from '@/lib/engagement'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<Tone, string> = {
  good: 'bg-good-tonal text-good',
  warn: 'bg-warn-tonal text-warn',
  bad: 'bg-bad-tonal text-bad',
  neutral: 'bg-surface-2 text-ink-2',
}

export const TONE_SOLID: Record<Tone, string> = {
  good: 'var(--green-solid)',
  warn: 'var(--amber-solid)',
  bad: 'var(--red-solid)',
  neutral: 'var(--text-3)',
}

export function Chip({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('card p-5 sm:p-6', className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-medium text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-ink-2">
        <span>{label}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-normal tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-3">{hint}</div>}
    </div>
  )
}

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton', className)} aria-hidden />
)

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-blue-tonal text-blue-tonal-ink">
        <Inbox className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-medium text-ink">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-ink-3">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
      <div className="grid size-14 place-items-center rounded-full bg-bad-tonal text-bad">
        <AlertCircle className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-medium text-ink">Couldn&apos;t load your data</h2>
      <p className="mt-1 max-w-md text-sm text-ink-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={cn(buttonClass('tonal'), 'mt-5')}>
          <RefreshCw className="size-4" /> Try again
        </button>
      )}
    </div>
  )
}

export function buttonClass(variant: 'filled' | 'tonal' | 'text' | 'outlined' = 'filled') {
  const base =
    'focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    filled: 'bg-blue text-blue-on hover:bg-blue-hover',
    tonal: 'bg-blue-tonal text-blue-tonal-ink hover:brightness-95',
    text: 'text-blue hover:bg-blue-tonal/40 px-3',
    outlined: 'border border-line text-blue hover:bg-blue-tonal/30',
  }
  return cn(base, variants[variant])
}

export const PageSkeleton = () => (
  <div className="space-y-5" aria-busy aria-label="Loading">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
    <Skeleton className="h-80" />
    <Skeleton className="h-64" />
  </div>
)
