import Link from 'next/link'
import { ChevronRight, Video } from 'lucide-react'
import {
  formatDuration,
  formatTime,
  meetingLabel,
  sessionDurationSeconds,
  sessionScore,
  toneFor,
} from '@/lib/engagement'
import type { SessionDTO } from '@/lib/types'
import { Chip } from './ui'

export function scoreLabel(score: number | null) {
  if (score === null) return 'Not analysed'
  if (score >= 65) return 'Engaged'
  if (score >= 45) return 'Mixed'
  return 'Low'
}

export function SessionRow({ session }: { session: SessionDTO }) {
  const score = sessionScore(session)
  const tone = toneFor(score)
  const start = session.startedAt ?? session.savedAt
  return (
    <Link
      href={`/sessions/${session.sessionId}`}
      className="focus-ring group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-tonal text-blue-tonal-ink">
        <Video className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-ink">{meetingLabel(session)}</span>
        <span className="block truncate text-xs text-ink-3">
          {formatTime(start)} · {formatDuration(sessionDurationSeconds(session))}
          {session.role ? ` · ${session.role}` : ''}
        </span>
      </span>
      <Chip tone={tone}>
        {score === null ? scoreLabel(score) : `${scoreLabel(score)} · ${score}`}
      </Chip>
      <ChevronRight className="hidden size-5 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  )
}
