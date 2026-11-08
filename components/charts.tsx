'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

export type ChartPoint = {
  id: string
  /** Short axis label. */
  label: string
  /** 0-100, or null for a gap (no data). */
  value: number | null
  /** Tooltip lines. */
  title: string
  detail?: string
}

const W = 640
const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 34 }

/** Responsive SVG area/line chart with a hover/focus/click tooltip. Values are 0-100. */
export function TrendChart({
  points,
  selectedId,
  onSelect,
  className,
}: {
  points: ChartPoint[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
}) {
  const gradientId = useId()
  const [hover, setHover] = useState<string | null>(null)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - v / 100) * innerH

  // Split into continuous runs so gaps (null) break the line.
  const runs: { i: number; v: number }[][] = []
  points.forEach((p, i) => {
    if (p.value === null) {
      runs.push([])
    } else {
      if (!runs.length) runs.push([])
      runs[runs.length - 1].push({ i, v: p.value })
    }
  })
  const lineFor = (run: { i: number; v: number }[]) =>
    run.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const areaFor = (run: { i: number; v: number }[]) =>
    `${lineFor(run)} L${x(run[run.length - 1].i).toFixed(1)},${y(0)} L${x(run[0].i).toFixed(1)},${y(0)} Z`

  const active = points.find((p) => p.id === (hover ?? selectedId))
  const activeIndex = active ? points.indexOf(active) : -1
  const labelEvery = Math.max(1, Math.ceil(points.length / 7))

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-manipulation select-none"
        role="img"
        aria-label="Engagement over time"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">
              {t}
            </text>
          </g>
        ))}

        {runs
          .filter((r) => r.length > 1)
          .map((run, k) => (
            <g key={k}>
              <path d={areaFor(run)} fill={`url(#${gradientId})`} />
              <path d={lineFor(run)} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}

        {activeIndex >= 0 && (
          <line x1={x(activeIndex)} x2={x(activeIndex)} y1={PAD.top} y2={y(0)} stroke="var(--blue)" strokeOpacity="0.4" strokeDasharray="3 3" />
        )}

        {points.map((p, i) => (
          <g key={p.id}>
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-3)">
                {p.label}
              </text>
            )}
            {p.value !== null && (
              <>
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={p.id === (hover ?? selectedId) ? 6 : points.length > 40 ? 0 : 3.5}
                  fill="var(--surface)"
                  stroke="var(--blue)"
                  strokeWidth="2.5"
                />
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={Math.max(10, Math.min(18, innerW / points.length / 2))}
                  fill="transparent"
                  className={cn('focus:outline-none', onSelect && 'cursor-pointer')}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.title}${p.detail ? `, ${p.detail}` : ''}`}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => onSelect?.(p.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(p.id)}
                />
              </>
            )}
          </g>
        ))}
      </svg>

      {active && active.value !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs text-bg shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, (x(activeIndex) / W) * 100))}%`,
            top: `${(y(active.value) / H) * 100 - 3}%`,
          }}
        >
          <div className="font-medium">{active.title}</div>
          {active.detail && <div className="opacity-80">{active.detail}</div>}
        </div>
      )}
    </div>
  )
}

export type Segment = { label: string; value: number; color: string }

export function Donut({ segments, center, caption }: { segments: Segment[]; center: string; caption: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" role="img" aria-label={caption}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="16" />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * c
              const el = (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += len
              return el
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl text-ink">{center}</div>
            <div className="text-[11px] text-ink-3">{caption}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="text-ink">
              {s.value}
              {total > 0 && <span className="ml-1 text-ink-3">· {Math.round((s.value / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarRow({
  label,
  value,
  suffix = '%',
  color,
  note,
}: {
  label: string
  value: number
  suffix?: string
  color: string
  note?: string
}) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="truncate text-ink-2 capitalize">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="w-20 text-right text-ink">
        {value}
        {suffix}
        {note && <span className="ml-1 text-xs text-ink-3">{note}</span>}
      </span>
    </div>
  )
}
