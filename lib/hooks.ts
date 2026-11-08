'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, fetchSessionReport, fetchSessions } from './api'
import { useAuth } from './auth'
import { toWindows } from './engagement'
import type { SessionDTO, SessionReportDTO, Window } from './types'

type Async<T> = {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** Runs an authenticated request, signing the user out if the backend rejects the token. */
function useAuthed<T>(load: (token: string, signal: AbortSignal) => Promise<T>, deps: unknown[]): Async<T> {
  const { token, signOut } = useAuth()
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    load(token, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        if (err instanceof ApiError && err.status === 401) {
          signOut()
          return
        }
        setState({ data: null, loading: false, error: err.message })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, nonce, ...deps])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

export const useSessions = (): Async<SessionDTO[]> => useAuthed(fetchSessions, [])

export function useSessionReport(sessionId: string): Async<SessionReportDTO> & { windows: Window[] } {
  const result = useAuthed((token, signal) => fetchSessionReport(sessionId, token, signal), [sessionId])
  const windows = useMemo(() => (result.data ? toWindows(result.data.records) : []), [result.data])
  return { ...result, windows }
}
