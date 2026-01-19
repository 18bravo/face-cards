import { NextRequest, NextResponse } from 'next/server'
import { createSession, validateCredentials, revokeSession, COOKIE_NAME } from '@/lib/admin-auth'
import { loginSchema } from '@/lib/validations'

// Simple in-memory rate limiter (for production, use Redis-based solution)
const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }

  if (record.count >= MAX_ATTEMPTS) {
    return true
  }

  record.count++
  return false
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip)
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  // Check rate limit
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { username, password } = result.data

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Successful login - reset rate limit
    resetRateLimit(clientIp)

    const token = await createSession(username)
    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    // Log error safely without exposing details
    if (process.env.NODE_ENV !== 'production') {
      console.error('Auth error:', error)
    }
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Revoke the current token before clearing the cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token) {
    await revokeSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
