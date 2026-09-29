/** Cookie de sessão — httpOnly para que o JS (e XSS) nunca leia o token. */
import type { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'movimento_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export function readSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value
}

/**
 * `secure` segue o protocolo do pedido: em LAN por http:// (teste no telemóvel)
 * um cookie `secure` seria rejeitado pelo browser; atrás de HTTPS/túnel fica true.
 */
function isSecure(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:'
}

export function setSessionCookie(request: NextRequest, response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(request),
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
