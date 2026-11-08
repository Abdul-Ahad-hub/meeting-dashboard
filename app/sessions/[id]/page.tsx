'use client'

import Link from 'next/link'
import { use, useMemo, useState } from 'react'
import { ArrowLeft, Camera, Flame, Gauge, Timer } from 'lucide-react'
import { useSessionReport } from '@/lib/hooks'
import {
  STATE_META,
  computeStats,
  formatDate,
  formatDuration,
  formatTime,
  meetingLabel,
  sessionDurationSeconds,
  sessionScore,
  toneFor,
} from '@/lib/engagement'
import { ApiError } from '@/lib/api'
import { Donut, TrendChart, type ChartPoint } from '@/components/charts'
import { Card, Chip, EmptyState, ErrorState, PageSkeleton, Stat, TONE_SOLID, buttonClass } from '@/components/ui'
import { scoreLabel } from '@/components/session-row'
import { cn } from '@/lib/utils'

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, windows, loading, error, reload } = useSessionReport(id)
  const [selected, setSelected] = useState<string | null>(null)
  const stats = useMemo(() => computeStats(windows), [windows])

  const back = (
    <Link href="/sessions" className={cn(buttonClass('text'), '-ml-3')}>
      <ArrowLeft className="size-4" /> Sessions
    </Link>
  )

  if (loading && !data) return <PageSkeleton />
  if (error)
    return (
      <div className="space-y-4">
        {back}
        {/not found/i.test(error) ? (
          <EmptyState title="Session not found" body="It may belong to a different Google account, or it hasn't been saved yet." />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    )
  const session = data?.session
  if (!session) return <div className="space-y-4">{back}<EmptyState title="Session not found" body="This session doesn't exist." /></div>

  const score = sessionScore(session)
  const start = session.startedAt ?? windows[0]?.start ?? session.savedAt
  const points: ChartPoint[] = windows.map((w) => ({
    id: String(w.index),
    label: formatTime(w.start),
    value: w.value,
    title: `${formatTime(w.start)} · ${STATE_META[w.state].label}`,
    detail: w.value === null ? (w.skipReason === 'too_few_faces' ? 'Face not visible' : 'No analysis') : `Engagement ${w.value}`,
  }))
  const chosen = windows.find((w) => String(w.index) === selected)

  return (
    <div className="space-y-5">
      <div>
        {back}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-mono text-[26px] leading-9 text-ink">{meetingLabel(session)}</h1>
          <Chip tone={toneFor(score)}>{scoreLabel(score)}</Chip>
          {session.role && <Chip>{session.role}</Chip>}
        </div>
        <p className="mt-1 text-sm text-ink-3">
          {formatDate(start)} · {formatTime(start)} · {formatDuration(sessionDurationSeconds(session))}
          {session.endReason ? ` · ended: ${session.endReason.replace('-', ' ')}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Engagement" value={stats.average ?? '–'} hint="average, out of 100" icon={<Gauge className="size-4" />} />
        <Stat label="Engaged" value={stats.engagedShare === null ? '–' : `${stats.engagedShare}%`} hint={`${stats.engaged} of ${stats.inferred} windows`} icon={<Flame className="size-4" />} />
        <Stat label="Longest focus" value={formatDuration(stats.longestEngagedStreak * 30)} hint="unbroken engaged stretch" icon={<Timer className="size-4" />} />
        <Stat label="Face visibility" value={stats.faceVisibility === null ? '–' : `${stats.faceVisibility}%`} hint="of captured frames" icon={<Camera className="size-4" />} />
      </div>

      {windows.length === 0 ? (
        <EmptyState title="No analysis windows" body="This session was saved before any 10-second window was analysed." />
      ) : (
        <>
          <Card title="Engagement timeline" subtitle="One point per analysed 10-second window. Gaps mean your face wasn't visible.">
            <TrendChart points={points} selectedId={selected} onSelect={setSelected} />
            <div className="mt-4 min-h-14 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
              {chosen ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium text-ink">
                    {formatTime(chosen.start)} – {formatTime(chosen.end)}
                  </span>
                  <Chip tone={STATE_META[chosen.state].tone}>{STATE_META[chosen.state].label}</Chip>
                  <span className="text-ink-3">
                    {chosen.value !== null ? `Engagement ${chosen.value} · ` : ''}
                    face in {chosen.faceFrames}/{chosen.framesFilled} frames
                    {chosen.partial ? ' · partial window' : ''}
                  </span>
                </div>
              ) : (
                <span className="text-ink-3">Select a point or a block below to see that moment.</span>
              )}
            </div>
            <div className="mt-4 flex gap-0.5 overflow-hidden rounded-full" role="list" aria-label="Windows">
              {windows.map((w) => (
                <button
                  key={w.index}
                  role="listitem"
                  onClick={() => setSelected(String(w.index))}
                  title={`${formatTime(w.start)} · ${STATE_META[w.state].label}`}
                  aria-label={`${formatTime(w.start)} ${STATE_META[w.state].label}`}
                  className={cn('focus-ring h-3 min-w-px flex-1 transition-opacity hover:opacity-70', selected === String(w.index) && 'ring-2 ring-ink')}
                  style={{ background: TONE_SOLID[STATE_META[w.state].tone] }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-3">
              {(['good', 'bad', 'neutral'] as const).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: TONE_SOLID[t] }} />
                  {t === 'good' ? 'Engaged' : t === 'bad' ? 'Not engaged' : 'Face not visible'}
                </span>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Breakdown" subtitle="Share of analysed windows">
              <Donut
                caption="windows"
                center={`${stats.windows}`}
                segments={[
                  { label: 'Engaged', value: stats.engaged, color: TONE_SOLID.good },
                  { label: 'Not engaged', value: stats.notEngaged, color: TONE_SOLID.bad },
                  { label: 'Face not visible', value: stats.noFace, color: TONE_SOLID.neutral },
                ]}
              />
            </Card>

            <Card title="Attention dips" subtitle="Stretches of 2+ consecutive not-engaged windows">
              {stats.dips.length === 0 ? (
                <p className="rounded-2xl bg-good-tonal px-4 py-3 text-sm text-good">No sustained dips. Nice focus.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.dips.map((d) => (
                    <li key={d.from.index}>
                      <button
                        onClick={() => setSelected(String(d.from.index))}
                        className="focus-ring flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left text-sm hover:brightness-95"
                      >
                        <span className="text-ink">
                          {formatTime(d.from.start)} – {formatTime(d.to.end)}
                        </span>
                        <Chip tone="bad">{formatDuration(d.length * 30)}</Chip>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Capture quality" subtitle="How reliable this session's data is">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
              {[
                ['Frames captured', session.framesCaptured],
                ['With a face', session.framesWithFace],
                ['Center-cropped', session.framesCenterCrop],
                ['Windows analysed', `${session.windowsInferred}/${session.windowsStored}`],
                ['Avg. frame time', `${Math.round(session.avgFrameMs)} ms`],
                ['Slowest frame', `${Math.round(session.maxFrameMs)} ms`],
                ['Windows sent', session.windowsSent],
                ['Not delivered', session.windowsUnsent],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="mt-0.5 text-lg text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </>
      )}
    </div>
  )
}
