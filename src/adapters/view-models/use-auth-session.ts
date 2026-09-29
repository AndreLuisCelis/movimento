'use client'

import { useCallback, useEffect, useState } from 'react'

export type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

type SessionState = {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export function useAuthSession() {
  const [state, setState] = useState<SessionState>({
    user: null,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!response.ok) {
        setState({ user: null, loading: false, error: null })
        return null
      }

      const payload = (await response.json().catch(() => ({}))) as { user?: AuthUser | null }
      setState({ user: payload.user ?? null, loading: false, error: null })
      return payload.user ?? null
    } catch {
      setState({ user: null, loading: false, error: null })
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    setState((current) => ({ ...current, error: null }))

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const payload = (await response.json().catch(() => ({}))) as { user?: AuthUser; error?: string }

    if (!response.ok) {
      const message = payload.error ?? 'Não foi possível iniciar sessão.'
      setState((current) => ({ ...current, error: message }))
      throw new Error(message)
    }

    setState({ user: payload.user ?? null, loading: false, error: null })
    return payload.user ?? null
  }, [])

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    setState((current) => ({ ...current, error: null }))

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const payload = (await response.json().catch(() => ({}))) as { user?: AuthUser; error?: string }

    if (!response.ok) {
      const message = payload.error ?? 'Não foi possível criar a conta.'
      setState((current) => ({ ...current, error: message }))
      throw new Error(message)
    }

    setState({ user: payload.user ?? null, loading: false, error: null })
    return payload.user ?? null
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setState({ user: null, loading: false, error: null })
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    refresh,
    signIn,
    signUp,
    signOut,
  }
}
