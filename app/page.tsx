'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, Camera, Clock, Video } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSessions } from '@/lib/hooks'
import {
  byHour,
  byRole,
  formatDate,
  formatDay,
  formatDuration,
  formatHour,
  meetingLabel,
  sessionDurationSeconds,
  sessionScore,
  toneFor,
} from '@/lib/engagement'
import type { SessionDTO } from '@/lib/types'
import { BarRow, Donut, TrendChart, type ChartPoint } from '@/components/charts'
import { SessionRow } from '@/components/session-row'
import { Card, EmptyState, ErrorState, PageSkeleton, Stat, TONE_SOLID, buttonClass } from '@/components/ui'

const average = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null)

function buildInsights(sessions: SessionDTO[]): string[] {
  const insights: string[] = []
  const scored = sessions.filter((s) => sessionScore(s) !== null)
  if (scored.length >= 2) {
    const chrono = [...scored].sort((a, b) => +new Date(a.savedAt) - +new Date(b.savedAt))
    const recent = average(chrono.slice(-3).map((s) => sessionScore(s)!))!
    const earlier = chrono.slice(0, -3).map((s) => sessionScore(s)!)
    if (earlier.length) {
      const diff = recent - average(earlier)!
      if (Math.abs(diff) >= 3)
        insights.push(
          `Your last ${Math.min(3, chrono.length)} meetings are ${Math.abs(diff)} points ${diff > 0 ? 'higher' : 'lower'} than your earlier average.`,
        )
    }
  }
  const hours = byHour(sessions)
  if (hours.length >= 2) {
    const best = [...hours].sort((a, b) => b.average - a.average)[0]
    insights.push(`You tend to be most engaged around ${formatHour(best.hour)} (${best.average} on average).`)
  }
  const frames = sessions.reduce((s, x) => s + x.framesCaptured, 0)
  const faces = sessions.reduce((s, x) => s + x.framesWithFace, 0)
  if (frames > 0 && faces / frames < 0.7)
    insights.push(
      `Your face was visible in only ${Math.round((faces / frames) * 100)}% of captured frames. Better lighting or camera position will make scores more reliable.`,
    )
  const unsent = sessions.reduce((s, x) => s + x.windowsUnsent, 0)
  if (unsent > 0) insights.push(`${unsent} analysis window${unsent > 1 ? 's' : ''} could not be delivered and are missing from the stats.`)
  return insights
}

export default function OverviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: sessions, loading, error, reload } = useSessions()

  if (loading && !sessions) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!sessions || sessions.length === 0)
    return (
      <EmptyState
        title="No sessions yet"
        body="Join a Google Meet call with the Meet Recorder extension and your camera on. Your first session shows up here once it's saved."
      />
    )

  const chrono = [...sessions].sort((a, b) => +new Date(a.savedAt) - +new Date(b.savedAt))
  const scores = chrono.map(sessionScore).filter((n): n is number => n !== null)
  const totalSeconds = sessions.reduce((s, x) => s + sessionDurationSeconds(x), 0)
  const frames = sessions.reduce((s, x) => s + x.framesCaptured, 0)
  const faces = sessions.reduce((s, x) => s + x.framesWithFace, 0)
  const avg = average(scores)

  const points: ChartPoint[] = chrono.slice(-30).map((s) => {
    const score = sessionScore(s)
    return {
      id: s.sessionId,
      label: new Date(s.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: score,
      title: `${meetingLabel(s)} · ${score ?? '–'}`,
      detail: formatDate(s.savedAt),
    }
  })

  const outcomes = [
    { label: 'Engaged', value: scores.filter((n) => n >= 65).length, color: TONE_SOLID.good },
    { label: 'Mixed', value: scores.filter((n) => n >= 45 && n < 65).length, color: TONE_SOLID.warn },
    { label: 'Low', value: scores.filter((n) => n < 45).length, color: TONE_SOLID.bad },
    { label: 'Not analysed', value: sessions.length - scores.length, color: TONE_SOLID.neutral },
  ]
  const roles = byRole(sessions)
  const hours = byHour(sessions)
  const insights = buildInsights(sessions)
  const first = user?.name.split(' ')[0]

  return (
    <div className="space-y-5">
      <div className="pt-2 pb-1">
        <h1 className="text-[28px] leading-9 text-ink">Hi {first}</h1>
        <p className="text-sm text-ink-3">Here&apos;s how engaged you&apos;ve been across your Meet calls.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Meetings" value={sessions.length} hint={`since ${formatDay(chrono[0].savedAt)}`} icon={<Video className="size-4" />} />
        <Stat label="Avg. engagement" value={avg === null ? '–' : avg} hint="out of 100" icon={<Activity className="size-4" />} />
        <Stat label="Time analysed" value={formatDuration(totalSeconds)} hint="in analysed calls" icon={<Clock className="size-4" />} />
        <Stat label="Face visibility" value={frames ? `${Math.round((faces / frames) * 100)}%` : '–'} hint="of captured frames" icon={<Camera className="size-4" />} />
      </div>

      <Card title="Engagement trend" subtitle="Average engagement per meeting. Select a point to open it.">
        <TrendChart points={points} onSelect={(id) => router.push(`/sessions/${id}`)} />
      </Card>

      {insights.length > 0 && (
        <Card title="Highlights">
          <ul className="space-y-2 text-sm text-ink-2">
            {insights.map((t) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-surface-2 px-4 py-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Meeting outcomes" subtitle="How your meetings were rated overall">
          <Donut segments={outcomes} center={`${sessions.length}`} caption="meetings" />
        </Card>
        <Card title="By role" subtitle="Average engagement when hosting vs. attending">
          <div className="space-y-4">
            {roles.map((r) => (
              <BarRow key={r.role} label={r.role} value={r.average ?? 0} suffix="" color={TONE_SOLID[toneFor(r.average)]} note={`${r.sessions}×`} />
            ))}
          </div>
          {hours.length > 1 && (
            <>
              <h3 className="mt-7 mb-3 text-sm font-medium text-ink">By time of day</h3>
              <div className="space-y-3">
                {hours.map((h) => (
                  <BarRow key={h.hour} label={formatHour(h.hour)} value={h.average} suffix="" color={TONE_SOLID[toneFor(h.average)]} note={`${h.sessions}×`} />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card
        title="Recent meetings"
        action={
          <Link href="/sessions" className={buttonClass('text')}>
            View all
          </Link>
        }
      >
        <div className="-mx-3 divide-y divide-line-subtle">
          {sessions.slice(0, 5).map((s) => (
            <SessionRow key={s.sessionId} session={s} />
          ))}
        </div>
      </Card>
    </div>
  )
}
