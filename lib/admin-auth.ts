import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { timingSafeEqual, randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'admin_session'
const TOKEN_EXPIRY_HOURS = 24

function getSecret() {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET not configured')
  return new TextEncoder().encode(secret)
}

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Compare against itself to maintain constant time
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export async function createSession(username: string): Promise<string> {
  const jti = randomUUID() // Unique token ID for revocation
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username) // User identifier
    .setJti(jti) // Token ID for revocation
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(getSecret())
  return token
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    // Check if token has been revoked in database
    if (payload.jti) {
      const revoked = await prisma.revokedToken.findUnique({
        where: { jti: payload.jti },
      })
      if (revoked) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

export async function revokeSession(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.jti && payload.exp) {
      // Store in database with expiration time for cleanup
      await prisma.revokedToken.create({
        data: {
          jti: payload.jti,
          expiresAt: new Date(payload.exp * 1000),
        },
      })
    }
  } catch {
    // Token already invalid, nothing to revoke
  }
}

// Check if a token JTI is revoked (for use in middleware)
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const revoked = await prisma.revokedToken.findUnique({
    where: { jti },
  })
  return !!revoked
}

// Cleanup expired revoked tokens (call periodically)
export async function cleanupRevokedTokens(): Promise<number> {
  const result = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  return result.count
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken()
  if (!token) return false
  return verifySession(token)
}

export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD
  if (!validUsername || !validPassword) {
    throw new Error('ADMIN_USERNAME or ADMIN_PASSWORD not configured')
  }
  // Use timing-safe comparison to prevent timing attacks
  const usernameMatch = safeCompare(username, validUsername)
  const passwordMatch = safeCompare(password, validPassword)
  return usernameMatch && passwordMatch
}

export { COOKIE_NAME }
