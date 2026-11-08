/** Shapes returned by the Engagement Analysis System backend (`/engagement/me/*`). */

export type SessionDTO = {
  sessionId: string
  meetingId: string | null
  userEmail: string | null
  userName: string | null
  userId: string | null
  role: string | null
  endReason: string | null
  startedAt: string | null
  savedAt: string
  framesCaptured: number
  framesWithFace: number
  framesCenterCrop: number
  avgFrameMs: number
  maxFrameMs: number
  windowsSent: number
  windowsUnsent: number
  windowsStored: number
  windowsInferred: number
  avgEngagementScore: number | null
  dominantLabel: string | null
  createdAt: string
  updatedAt: string
}

export type RecordDTO = {
  id: string
  sessionId: string
  meetingId: string | null
  userEmail: string | null
  userName: string | null
  windowIndex: number
  engagementScore: number | null
  engagementLabel: string
  status: 'inferred' | 'skipped' | string
  skipReason: string | null
  framesFilled: number
  faceFrames: number
  partial: boolean
  startTime: string
  endTime: string
  createdAt: string
}

export type SessionReportDTO = {
  session: SessionDTO | null
  records: RecordDTO[]
}

export type WindowState = 'engaged' | 'not-engaged' | 'no-face'

/** A window after interpretation: a state plus a 0-100 engagement value (null if not inferred). */
export type Window = {
  index: number
  start: Date
  end: Date
  state: WindowState
  /** 0-100 probability that the person was engaged; null when the model did not run. */
  value: number | null
  faceFrames: number
  framesFilled: number
  partial: boolean
  skipReason: string | null
}

export type AuthUser = {
  email: string
  name: string
  picture?: string
}
