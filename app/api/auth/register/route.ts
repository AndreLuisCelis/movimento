import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/src/adapters/gateways/composition'
import { errorResponse } from '@/src/infrastructure/http/api-error'
import { setSessionCookie } from '@/src/infrastructure/http/auth-session'

/** POST /api/auth/register — cria a conta e inicia sessão. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const user = await auth.register(body)
    const session = await auth.createSession(user.id)
    const response = NextResponse.json({ user }, { status: 201 })
    setSessionCookie(request, response, session.token)
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
