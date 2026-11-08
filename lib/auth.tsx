'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchGoogleProfile } from './api'
import type { AuthUser } from './types'

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const STORAGE_KEY = 'meetly.session'

type Stored = { token: string; expiresAt: number; user: AuthUser }

type TokenResponse = { access_token?: string; expires_in?: number; error?: string }
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void }
type GoogleAccounts = {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string
        scope: string
        callback: (r: TokenResponse) => void
        error_callback?: (e: { type: string }) => void
      }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleAccounts
  }
}

type AuthState = {
  status: 'loading' | 'signed-out' | 'signing-in' | 'signed-in'
  user: AuthUser | null
  token: string | null
  error: string | null
  configured: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Could not load Google sign-in.')), {
      once: true,
    })
    if (!existing) {
      script.src = GIS_SRC
      script.async = true
      document.head.appendChild(script)
    }
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading')
  const [session, setSession] = useState<Stored | null>(null)
  const [error, setError] = useState<string | null>(null)
  const client = useRef<TokenClient | null>(null)
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    if (expiryTimer.current) clearTimeout(expiryTimer.current)
    setSession(null)
    setStatus('signed-out')
  }, [])

  const adopt = useCallback(
    (stored: Stored) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      setSession(stored)
      setStatus('signed-in')
      if (expiryTimer.current) clearTimeout(expiryTimer.current)
      expiryTimer.current = setTimeout(
        () => {
          setError('Your session expired. Please sign in again.')
          clear()
        },
        Math.max(0, stored.expiresAt - Date.now()),
      )
    },
    [clear],
  )

  // Restore a still-valid session after a page reload.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      const stored = raw ? (JSON.parse(raw) as Stored) : null
      if (stored && stored.expiresAt > Date.now() + 5_000) {
        adopt(stored)
        return
      }
    } catch {
      /* ignore corrupt storage */
    }
    sessionStorage.removeItem(STORAGE_KEY)
    setStatus('signed-out')
    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current)
    }
  }, [adopt])

  const signIn = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) return
    setError(null)
    setStatus('signing-in')
    try {
      await loadGis()
      client.current ??= window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (res) => {
          if (!res.access_token) {
            setError(res.error ? 'Google sign-in was cancelled or denied.' : 'Sign-in failed.')
            setStatus('signed-out')
            return
          }
          try {
            const user = await fetchGoogleProfile(res.access_token)
            adopt({
              token: res.access_token,
              expiresAt: Date.now() + (res.expires_in ?? 3600) * 1000,
              user,
            })
          } catch (err) {
            setError((err as Error).message)
            setStatus('signed-out')
          }
        },
        error_callback: () => {
          setError('The Google sign-in window was closed.')
          setStatus('signed-out')
        },
      })
      client.current.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      setError((err as Error).message)
      setStatus('signed-out')
    }
  }, [adopt])

  const signOut = useCallback(() => {
    if (session) window.google?.accounts.oauth2.revoke(session.token)
    clear()
  }, [clear, session])

  const value = useMemo<AuthState>(
    () => ({
      status,
      user: session?.user ?? null,
      token: session?.token ?? null,
      error,
      configured: Boolean(GOOGLE_CLIENT_ID),
      signIn,
      signOut,
    }),
    [status, session, error, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
