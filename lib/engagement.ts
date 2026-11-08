import type { RecordDTO, SessionDTO, Window, WindowState } from './types'

/**
 * The model answers every 10 s window with `engagement_Level` (stored as
 * `engagementLabel`) and a `confidence` for that class (stored as
 * `engagementScore`, 0-1). Level 1 = engaged, level 0 = not engaged.
 * If the model's classes ever change, this is the only place to update.
 */
const ENGAGED_LEVELS = new Set(['1', 'engaged', 'high'])

export function toWindow(r: RecordDTO): Window {
  const start = new Date(r.startTime)
  const end = new Date(r.endTime)
  const base = {
    index: r.windowIndex,
    start,
    end,
    faceFrames: r.faceFrames,
    framesFilled: r.framesFilled,
    partial: r.partial,
    skipReason: r.skipReason,
  }
  if (r.status !== 'inferred') return { ...base, state: 'no-face', value: null }

  const engaged = ENGAGED_LEVELS.has(String(r.engagementLabel).trim().toLowerCase())
  const confidence = typeof r.engagementScore === 'number' ? clamp01(r.engagementScore) : null
  const value = confidence === null ? (engaged ? 100 : 0) : (engaged ? confidence : 1 - confidence) * 100
  return { ...base, state: engaged ? 'engaged' : 'not-engaged', value: Math.round(value) }
}

export const toWindows = (records: RecordDTO[]): Window[] =>
  records.map(toWindow).sort((a, b) => a.index - b.index)

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export type SessionStats = {
  windows: number
  inferred: number
  engaged: number
  notEngaged: number
  noFace: number
  /** Average 0-100 engagement across inferred windows, null when nothing was inferred. */
  average: number | null
  /** Share (0-100) of inferred windows classified as engaged. */
  engagedShare: number | null
  /** Share (0-100) of captured frames that had a detected face. */
  faceVisibility: number | null
  longestEngagedStreak: number
  longestDipStreak: number
  /** Runs of 2+ consecutive not-engaged windows. */
  dips: { from: Window; to: Window; length: number }[]
  /** Seconds of analysed time (sum of window spans). */
  analysedSeconds: number
}

export function computeStats(windows: Window[]): SessionStats {
  const inferred = windows.filter((w) => w.state !== 'no-face')
  const engaged = inferred.filter((w) => w.state === 'engaged').length
  const values = inferred.map((w) => w.value as number)
  const frames = windows.reduce((s, w) => s + w.framesFilled, 0)
  const faces = windows.reduce((s, w) => s + w.faceFrames, 0)

  let bestEngaged = 0
  let bestDip = 0
  let runEngaged = 0
  let runDip = 0
  const dips: SessionStats['dips'] = []
  let dipStart: Window | null = null

  windows.forEach((w, i) => {
    runEngaged = w.state === 'engaged' ? runEngaged + 1 : 0
    runDip = w.state === 'not-engaged' ? runDip + 1 : 0
    bestEngaged = Math.max(bestEngaged, runEngaged)
    bestDip = Math.max(bestDip, runDip)

    if (w.state === 'not-engaged') dipStart ??= w
    const last = i === windows.length - 1
    if (dipStart && (w.state !== 'not-engaged' || last)) {
      const endW = w.state === 'not-engaged' ? w : windows[i - 1]
      const length = endW.index - dipStart.index + 1
      if (length >= 2) dips.push({ from: dipStart, to: endW, length })
      dipStart = null
    }
  })

  return {
    windows: windows.length,
    inferred: inferred.length,
    engaged,
    notEngaged: inferred.length - engaged,
    noFace: windows.length - inferred.length,
    average: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null,
    engagedShare: inferred.length ? Math.round((engaged / inferred.length) * 100) : null,
    faceVisibility: frames ? Math.round((faces / frames) * 100) : null,
    longestEngagedStreak: bestEngaged,
    longestDipStreak: bestDip,
    dips,
    analysedSeconds: windows.reduce((s, w) => s + Math.max(0, (+w.end - +w.start) / 1000), 0),
  }
}

/** Session-level engagement as 0-100, from the stored average (null if never inferred). */
export function sessionScore(s: SessionDTO): number | null {
  if (s.avgEngagementScore === null || s.windowsInferred === 0) return null
  // The stored average is the mean model confidence; map it with the dominant class.
  const dominantEngaged = ENGAGED_LEVELS.has(String(s.dominantLabel ?? '').trim().toLowerCase())
  const v = dominantEngaged ? s.avgEngagementScore : 1 - s.avgEngagementScore
  return Math.round(clamp01(v) * 100)
}

export function sessionDurationSeconds(s: SessionDTO): number {
  const start = s.startedAt ? +new Date(s.startedAt) : NaN
  const end = +new Date(s.savedAt)
  if (Number.isFinite(start) && end > start) return (end - start) / 1000
  return s.windowsStored * 30
}

export type Tone = 'good' | 'warn' | 'bad' | 'neutral'

export function toneFor(value: number | null): Tone {
  if (value === null) return 'neutral'
  if (value >= 65) return 'good'
  if (value >= 45) return 'warn'
  return 'bad'
}

export const STATE_META: Record<WindowState, { label: string; tone: Tone }> = {
  engaged: { label: 'Engaged', tone: 'good' },
  'not-engaged': { label: 'Not engaged', tone: 'bad' },
  'no-face': { label: 'Face not visible', tone: 'neutral' },
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} h ${rem} min` : `${h} h`
}

export const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

export const formatDay = (d: Date | string) =>
  new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

export function meetingLabel(s: Pick<SessionDTO, 'meetingId'>): string {
  return s.meetingId || 'Untitled meeting'
}

export type RoleSummary = { role: string; sessions: number; average: number | null }

export function byRole(sessions: SessionDTO[]): RoleSummary[] {
  const groups = new Map<string, number[]>()
  sessions.forEach((s) => {
    const role = (s.role || 'participant').toLowerCase()
    const list = groups.get(role) ?? []
    const score = sessionScore(s)
    if (score !== null) list.push(score)
    groups.set(role, list)
  })
  const counts = new Map<string, number>()
  sessions.forEach((s) => {
    const role = (s.role || 'participant').toLowerCase()
    counts.set(role, (counts.get(role) ?? 0) + 1)
  })
  return [...groups.entries()].map(([role, list]) => ({
    role,
    sessions: counts.get(role) ?? 0,
    average: list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null,
  }))
}

/** Average engagement by hour of day (only hours that have data). */
export function byHour(sessions: SessionDTO[]): { hour: number; average: number; sessions: number }[] {
  const buckets = new Map<number, number[]>()
  sessions.forEach((s) => {
    const score = sessionScore(s)
    if (score === null) return
    const hour = new Date(s.startedAt ?? s.savedAt).getHours()
    buckets.set(hour, [...(buckets.get(hour) ?? []), score])
  })
  return [...buckets.entries()]
    .map(([hour, list]) => ({
      hour,
      average: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
      sessions: list.length,
    }))
    .sort((a, b) => a.hour - b.hour)
}

export const formatHour = (h: number) =>
  new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' })
