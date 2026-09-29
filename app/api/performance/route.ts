import { NextResponse, type NextRequest } from 'next/server'
import { auth, performanceApi } from '@/src/adapters/gateways/composition'
import { errorResponse, unauthorized } from '@/src/infrastructure/http/api-error'
import { readSessionToken } from '@/src/infrastructure/http/auth-session'

async function requireUser(request: NextRequest) {
  const user = await auth.currentUser(readSessionToken(request))
  return user
}

/** GET /api/performance — métricas do utilizador autenticado. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (!user) return unauthorized()
    const stats = await performanceApi.get(user.id)
    return NextResponse.json({ stats })
  } catch (error) {
    return errorResponse(error)
  }
}

/** POST /api/performance — regista um movimento concluído; devolve métricas atualizadas. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    if (!user) return unauthorized()
    const stats = await performanceApi.record(user.id)
    return NextResponse.json({ stats }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
