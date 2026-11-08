'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useSessions } from '@/lib/hooks'
import { formatDay, meetingLabel, sessionScore } from '@/lib/engagement'
import type { SessionDTO } from '@/lib/types'
import { SessionRow } from '@/components/session-row'
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'engaged', label: 'Engaged', test: (n: number | null) => n !== null && n >= 65 },
  { id: 'mixed', label: 'Mixed', test: (n: number | null) => n !== null && n >= 45 && n < 65 },
  { id: 'low', label: 'Low', test: (n: number | null) => n !== null && n < 45 },
  { id: 'none', label: 'Not analysed', test: (n: number | null) => n === null },
] as const

export default function SessionsPage() {
  const { data, loading, error, reload } = useSessions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  const groups = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test
    const q = query.trim().toLowerCase()
    const visible = (data ?? []).filter(
      (s) => test(sessionScore(s)) && (!q || meetingLabel(s).toLowerCase().includes(q)),
    )
    const byDay = new Map<string, SessionDTO[]>()
    visible.forEach((s) => {
      const key = formatDay(s.savedAt)
      byDay.set(key, [...(byDay.get(key) ?? []), s])
    })
    return [...byDay.entries()]
  }, [data, query, filter])

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-[28px] leading-9 text-ink">Sessions</h1>
        <p className="text-sm text-ink-3">Every meeting your extension has recorded.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search by meeting code</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by meeting code"
            className="focus-ring h-12 w-full rounded-full bg-surface-3/70 pr-4 pl-12 text-sm text-ink placeholder:text-ink-3 focus:bg-surface"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by rating">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'focus-ring h-9 shrink-0 rounded-lg border px-3 text-sm',
                filter === f.id ? 'border-transparent bg-blue-tonal text-blue-tonal-ink' : 'border-line text-ink-2 hover:bg-surface-2',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Skeleton className="h-72" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No sessions yet" body="Sessions appear here after the extension saves a call." />
      ) : groups.length === 0 ? (
        <EmptyState title="No matches" body="Try a different meeting code or filter." />
      ) : (
        groups.map(([day, list]) => (
          <Card key={day} title={day}>
            <div className="-mx-3 divide-y divide-line-subtle">
              {list.map((s) => (
                <SessionRow key={s.sessionId} session={s} />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
