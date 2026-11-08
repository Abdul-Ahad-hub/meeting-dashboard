import type { AuthUser, SessionReportDTO, SessionDTO } from './types'

/** Backend base URL. Override with NEXT_PUBLIC_API_URL (no trailing slash). */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://engagement-analysis-system.vercel.app'
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('Could not reach the engagement backend. Check your connection.', 0)
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body?.message === 'string') message = body.message
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status)
  }
  return (await res.json()) as T
}

export async function fetchSessions(token: string, signal?: AbortSignal): Promise<SessionDTO[]> {
  const data = await request<{ sessions: SessionDTO[] }>('/engagement/me/sessions', token, signal)
  return data.sessions
}

export function fetchSessionReport(
  sessionId: string,
  token: string,
  signal?: AbortSignal,
): Promise<SessionReportDTO> {
  return request<SessionReportDTO>(`/engagement/me/sessions/${sessionId}`, token, signal)
}

/** Reads the signed-in profile from Google using the same access token. */
export async function fetchGoogleProfile(token: string): Promise<AuthUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new ApiError('Google rejected the sign-in token.', res.status)
  const info = (await res.json()) as { email?: string; name?: string; picture?: string }
  if (!info.email) throw new ApiError('Your Google account did not share an email address.', 403)
  return { email: info.email, name: info.name || info.email, picture: info.picture }
}
