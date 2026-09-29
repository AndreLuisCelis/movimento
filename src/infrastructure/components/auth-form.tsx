'use client'

import { useEffect, useState } from 'react'
import { Button, InlineNotification, TextInput } from '@carbon/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthSession } from '@/src/adapters/view-models/use-auth-session'

type AuthFormProps = {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const { user, error, signIn, signUp } = useAuthSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [router, user])

  const isLogin = mode === 'login'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage(null)

    try {
      if (isLogin) {
        await signIn({ email, password })
      } else {
        await signUp({ name, email, password })
      }
      router.push('/dashboard')
    } catch (submitError) {
      const nextMessage = submitError instanceof Error ? submitError.message : 'Não foi possível concluir a operação.'
      setMessage(nextMessage)
    } finally {
      setPending(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f4f4f4' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', borderRadius: 12, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#525252', fontWeight: 600 }}>
            Movimento
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: 32, lineHeight: 1.2 }}>{isLogin ? 'Entrar' : 'Criar conta'}</h1>
        </div>

        {(message ?? error) && (
          <div style={{ marginBottom: 16 }}>
            <InlineNotification
              kind="error"
              title={isLogin ? 'Erro ao entrar' : 'Erro ao cadastrar'}
              subtitle={message ?? error ?? 'Tente novamente.'}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          {!isLogin && (
            <TextInput
              id="name"
              labelText="Nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}

          <TextInput
            id="email"
            type="email"
            labelText="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextInput
            id="password"
            type="password"
            labelText="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" disabled={pending}>
            {pending ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#525252' }}>
          {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <Link href={isLogin ? '/register' : '/login'} style={{ color: '#0f62fe', fontWeight: 600 }}>
            {isLogin ? 'Crie uma conta' : 'Entre agora'}
          </Link>
        </div>
      </div>
    </main>
  )
}
