import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/src/adapters/gateways/composition'
import { errorResponse } from '@/src/infrastructure/http/api-error'
import { clearSessionCookie, readSessionToken } from '@/src/infrastructure/http/auth-session'

/** POST /api/auth/logout — termina a sessão e limpa o cookie. */
export async function POST(request: NextRequest) {
  try {
    const token = readSessionToken(request)
    if (token) await auth.destroySession(token)
    const response = NextResponse.json({ ok: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
