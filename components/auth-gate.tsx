'use client'

import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Shell, Logo } from './shell'
import { ThemeToggle } from './theme-toggle'
import { Skeleton } from './ui'

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.2a24 24 0 0 0 0 21.6l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

function SignIn() {
  const { signIn, status, error, configured } = useAuth()
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="absolute top-3 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <Logo className="mx-auto size-12" />
        <h1 className="mt-4 text-2xl text-ink">Meet Engagement</h1>
        <p className="mt-2 text-sm text-ink-3">
          Sign in with the Google account you use with the Meet Recorder extension to see how engaged you were in your meetings.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-bad-tonal px-4 py-3 text-sm text-bad">
            {error}
          </p>
        )}

        {configured ? (
          <button
            onClick={signIn}
            disabled={status === 'signing-in'}
            className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
          >
            <GoogleG /> {status === 'signing-in' ? 'Waiting for Google…' : 'Sign in with Google'}
          </button>
        ) : (
          <div className="mt-6 rounded-2xl bg-warn-tonal px-4 py-3 text-left text-sm text-warn">
            Google sign-in isn&apos;t configured. Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to a Web OAuth client ID (see README).
          </div>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-3">
          <ShieldCheck className="size-4" /> You only ever see your own sessions.
        </p>
      </div>
    </div>
  )
}

/** Renders the app shell for signed-in users and the sign-in card otherwise. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Skeleton className="h-40 w-72" />
      </div>
    )
  }
  if (status !== 'signed-in') return <SignIn />
  return <Shell>{children}</Shell>
}
