import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/src/adapters/gateways/composition'
import { errorResponse, unauthorized } from '@/src/infrastructure/http/api-error'
import { readSessionToken } from '@/src/infrastructure/http/auth-session'

/** GET /api/auth/me — utilizador da sessão corrente (ou 401). */
export async function GET(request: NextRequest) {
  try {
    const user = await auth.currentUser(readSessionToken(request))
    if (!user) return unauthorized()
    return NextResponse.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}
