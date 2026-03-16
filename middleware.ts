import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'enderai_session'

function getSecret() {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

async function verifyToken(token: string): Promise<boolean> {
  const secret = getSecret()
  if (!secret) return false
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*'],
}
