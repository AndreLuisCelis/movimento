/** Mapeia erros de negócio/caso de uso para status HTTP da API. */
import { NextResponse } from 'next/server'

const STATUS_BY_ERROR: Record<string, number> = {
  EmailAlreadyRegisteredError: 409,
  InvalidCredentialsError: 401,
  InvalidNameError: 400,
  InvalidEmailError: 400,
  InvalidPasswordError: 400,
}

export function errorResponse(error: unknown): NextResponse {
  const known = error instanceof Error ? STATUS_BY_ERROR[error.name] : undefined
  const status = known ?? 500
  const message =
    status === 500 ? 'Erro interno. Tente novamente.' : error instanceof Error ? error.message : 'Erro.'
  return NextResponse.json({ error: message }, { status })
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
}
