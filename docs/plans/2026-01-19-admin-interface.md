# Admin Interface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an admin interface for managing face card leaders with manual CRUD and AI-powered refresh with diff review.

**Architecture:** Next.js App Router with server-side auth via JWT in HTTP-only cookies. Single-page admin dashboard with modals for editing. Preview/apply pattern for AI refresh prevents accidental data changes.

**Tech Stack:** Next.js 16, React 19, Prisma 7, jose (JWT), Tailwind CSS

---

## Prerequisites

Working directory: `/Users/johnferry/Documents/face-cards/.worktrees/admin-interface`

Verify TypeScript compiles before each commit:
```bash
npx tsc --noEmit
```

---

## Task 1: Add jose Dependency

**Files:**
- Modify: `package.json`

**Step 1: Install jose**

```bash
npm install jose
```

**Step 2: Verify installation**

```bash
npm list jose
```
Expected: `jose@5.x.x` (or similar)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose for JWT authentication"
```

---

## Task 2: Create Auth Library

**Files:**
- Create: `lib/admin-auth.ts`

**Step 1: Create auth helper file**

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'

function getSecret() {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET not configured')
  return new TextEncoder().encode(secret)
}

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(getSecret())
  return token
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
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
  return username === validUsername && password === validPassword
}

export { COOKIE_NAME }
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add lib/admin-auth.ts
git commit -m "feat: add admin auth library with JWT helpers"
```

---

## Task 3: Create Auth API Route

**Files:**
- Create: `app/api/admin/auth/route.ts`

**Step 1: Create auth route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSession, validateCredentials, COOKIE_NAME } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await createSession()
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
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/admin/auth/route.ts
git commit -m "feat: add admin auth API endpoints (login/logout)"
```

---

## Task 4: Create Middleware for Route Protection

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'admin_session'

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

  // Only protect /admin routes (except login page and auth API)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow login page and auth API
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next()
  }

  // Check for valid session
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    // Redirect to login for pages, return 401 for API
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware to protect admin routes"
```

---

## Task 5: Create Admin Login Page

**Files:**
- Create: `app/admin/login/page.tsx`

**Step 1: Create login page**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        return
      }

      router.push('/admin')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/admin/login/page.tsx
git commit -m "feat: add admin login page"
```

---

## Task 6: Create Admin Layout

**Files:**
- Create: `app/admin/layout.tsx`

**Step 1: Create admin layout**

```typescript
import { cookies } from 'next/headers'

async function getUsername() {
  // Username from env since we use simple auth
  return process.env.ADMIN_USERNAME || 'Admin'
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.has('admin_session')
  const username = await getUsername()

  // Login page doesn't need the header
  return (
    <div className="min-h-screen bg-gray-100">
      {isLoggedIn && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Face Cards Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as <strong>{username}</strong>
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/admin/auth" method="POST">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        formAction={async () => {
          'use server'
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          cookieStore.delete('admin_session')
        }}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </form>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with header and logout"
```

---

## Task 7: Create Leaders API Routes

**Files:**
- Create: `app/api/admin/leaders/route.ts`
- Create: `app/api/admin/leaders/[id]/route.ts`

**Step 1: Create list/create route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const branch = searchParams.get('branch')
  const search = searchParams.get('search')
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const where: Record<string, unknown> = {}

  if (!includeInactive) {
    where.isActive = true
  }

  if (category) {
    where.category = category
  }

  if (branch) {
    where.branch = branch
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ]
  }

  const leaders = await prisma.leader.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(leaders)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const leader = await prisma.leader.create({
      data: {
        name: data.name,
        title: data.title,
        photoUrl: data.photoUrl,
        category: data.category,
        branch: data.branch || null,
        organization: data.organization,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(leader, { status: 201 })
  } catch (error) {
    console.error('Create leader error:', error)
    return NextResponse.json(
      { error: 'Failed to create leader' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create single leader route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const leader = await prisma.leader.findUnique({
    where: { id },
  })

  if (!leader) {
    return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
  }

  return NextResponse.json(leader)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const data = await request.json()

    const leader = await prisma.leader.update({
      where: { id },
      data: {
        name: data.name,
        title: data.title,
        photoUrl: data.photoUrl,
        category: data.category,
        branch: data.branch || null,
        organization: data.organization,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(leader)
  } catch (error) {
    console.error('Update leader error:', error)
    return NextResponse.json(
      { error: 'Failed to update leader' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Soft delete - mark as inactive
    await prisma.leader.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete leader error:', error)
    return NextResponse.json(
      { error: 'Failed to delete leader' },
      { status: 500 }
    )
  }
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/admin/leaders/route.ts app/api/admin/leaders/\[id\]/route.ts
git commit -m "feat: add admin CRUD API routes for leaders"
```

---

## Task 8: Create Preview Refresh API

**Files:**
- Create: `app/api/admin/preview-refresh/route.ts`

**Step 1: Create preview refresh route**

```typescript
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import prisma from '@/lib/prisma'
import { fetchAllLeaders } from '@/lib/openai'

interface LeaderDiff {
  id?: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
}

interface DiffResult {
  additions: LeaderDiff[]
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
  previewToken: string
}

export async function POST() {
  try {
    // Fetch fresh data from OpenAI
    const freshLeaders = await fetchAllLeaders()

    // Get current leaders from database
    const currentLeaders = await prisma.leader.findMany({
      where: { isActive: true },
    })

    // Build lookup maps
    const currentByName = new Map(
      currentLeaders.map((l) => [l.name.toLowerCase(), l])
    )
    const freshByName = new Map(
      freshLeaders.map((l) => [l.name.toLowerCase(), l])
    )

    // Calculate diffs
    const additions: LeaderDiff[] = []
    const updates: DiffResult['updates'] = []
    const removals: DiffResult['removals'] = []

    // Find additions and updates
    for (const fresh of freshLeaders) {
      const current = currentByName.get(fresh.name.toLowerCase())

      if (!current) {
        additions.push(fresh)
      } else {
        const changes: Array<{ field: string; current: string; proposed: string }> = []

        if (current.title !== fresh.title) {
          changes.push({ field: 'title', current: current.title, proposed: fresh.title })
        }
        if (current.photoUrl !== fresh.photoUrl) {
          changes.push({ field: 'photoUrl', current: current.photoUrl, proposed: fresh.photoUrl })
        }
        if (current.organization !== fresh.organization) {
          changes.push({ field: 'organization', current: current.organization, proposed: fresh.organization })
        }

        if (changes.length > 0) {
          updates.push({ id: current.id, name: current.name, changes })
        }
      }
    }

    // Find removals
    for (const current of currentLeaders) {
      if (!freshByName.has(current.name.toLowerCase())) {
        removals.push({ id: current.id, name: current.name, title: current.title })
      }
    }

    // Create preview token (valid for 10 minutes)
    const secret = new TextEncoder().encode(process.env.ADMIN_SECRET)
    const previewToken = await new SignJWT({
      type: 'preview',
      additions,
      updates,
      removals,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .setIssuedAt()
      .sign(secret)

    const result: DiffResult = {
      additions,
      updates,
      removals,
      previewToken,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Preview refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/admin/preview-refresh/route.ts
git commit -m "feat: add preview-refresh API with diff calculation"
```

---

## Task 9: Create Apply Refresh API

**Files:**
- Create: `app/api/admin/apply-refresh/route.ts`

**Step 1: Create apply refresh route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

interface LeaderDiff {
  id?: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
}

interface PreviewPayload {
  type: string
  additions: LeaderDiff[]
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
}

export async function POST(request: NextRequest) {
  try {
    const { previewToken } = await request.json()

    if (!previewToken) {
      return NextResponse.json(
        { error: 'Preview token required' },
        { status: 400 }
      )
    }

    // Verify and decode token
    const secret = new TextEncoder().encode(process.env.ADMIN_SECRET)
    let payload: PreviewPayload

    try {
      const { payload: verified } = await jwtVerify(previewToken, secret)
      payload = verified as unknown as PreviewPayload

      if (payload.type !== 'preview') {
        throw new Error('Invalid token type')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired preview token' },
        { status: 400 }
      )
    }

    // Apply changes in a transaction
    await prisma.$transaction(async (tx) => {
      // Apply additions
      for (const addition of payload.additions) {
        await tx.leader.create({
          data: {
            name: addition.name,
            title: addition.title,
            photoUrl: addition.photoUrl,
            category: addition.category as never,
            branch: addition.branch as never,
            organization: addition.organization,
            isActive: true,
          },
        })
      }

      // Apply updates
      for (const update of payload.updates) {
        const data: Record<string, string> = {}
        for (const change of update.changes) {
          data[change.field] = change.proposed
        }
        await tx.leader.update({
          where: { id: update.id },
          data,
        })
      }

      // Apply removals (soft delete)
      for (const removal of payload.removals) {
        await tx.leader.update({
          where: { id: removal.id },
          data: { isActive: false },
        })
      }
    })

    return NextResponse.json({
      success: true,
      applied: {
        additions: payload.additions.length,
        updates: payload.updates.length,
        removals: payload.removals.length,
      },
    })
  } catch (error) {
    console.error('Apply refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to apply changes' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/admin/apply-refresh/route.ts
git commit -m "feat: add apply-refresh API with transaction support"
```

---

## Task 10: Create Leader Table Component

**Files:**
- Create: `components/admin/LeaderTable.tsx`

**Step 1: Create leader table component**

```typescript
'use client'

import { useState } from 'react'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
  isActive: boolean
}

interface LeaderTableProps {
  leaders: Leader[]
  onEdit: (leader: Leader) => void
  onDelete: (leader: Leader) => void
}

type SortKey = 'name' | 'title' | 'category' | 'branch'

export function LeaderTable({ leaders, onEdit, onDelete }: LeaderTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...leaders].sort((a, b) => {
    const aVal = a[sortKey] || ''
    const bVal = b[sortKey] || ''
    const cmp = aVal.localeCompare(bVal)
    return sortAsc ? cmp : -cmp
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const isActive = sortKey === sortKeyName
    return (
      <th
        className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
        onClick={() => handleSort(sortKeyName)}
      >
        {label} {isActive && (sortAsc ? '↑' : '↓')}
      </th>
    )
  }

  const fallbackUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=1e3a5f&color=fff`

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Photo</th>
            <SortHeader label="Name" sortKeyName="name" />
            <SortHeader label="Title" sortKeyName="title" />
            <SortHeader label="Category" sortKeyName="category" />
            <SortHeader label="Branch" sortKeyName="branch" />
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((leader) => (
            <tr
              key={leader.id}
              className={`border-b hover:bg-gray-50 ${!leader.isActive ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-3">
                <img
                  src={leader.photoUrl || fallbackUrl(leader.name)}
                  alt={leader.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = fallbackUrl(leader.name)
                  }}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {leader.name}
                {!leader.isActive && (
                  <span className="ml-2 text-xs text-red-500">(inactive)</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{leader.title}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {leader.category}
                </span>
              </td>
              <td className="px-4 py-3">
                {leader.branch && (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                    {leader.branch}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onEdit(leader)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(leader)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/LeaderTable.tsx
git commit -m "feat: add LeaderTable component with sorting"
```

---

## Task 11: Create Leader Form Component

**Files:**
- Create: `components/admin/LeaderForm.tsx`

**Step 1: Create leader form component**

```typescript
'use client'

import { useState, useEffect } from 'react'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
  isActive: boolean
}

interface LeaderFormProps {
  leader: Leader | null
  onSave: (data: Partial<Leader>) => Promise<void>
  onCancel: () => void
}

const CATEGORIES = [
  'MILITARY_4STAR',
  'MILITARY_3STAR',
  'MAJOR_COMMAND',
  'SERVICE_SECRETARY',
  'CIVILIAN_SES',
  'APPOINTEE',
  'SECRETARIAT',
]

const BRANCHES = [
  'ARMY',
  'NAVY',
  'AIR_FORCE',
  'MARINE_CORPS',
  'SPACE_FORCE',
  'COAST_GUARD',
]

export function LeaderForm({ leader, onSave, onCancel }: LeaderFormProps) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [branch, setBranch] = useState<string>('')
  const [organization, setOrganization] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (leader) {
      setName(leader.name)
      setTitle(leader.title)
      setPhotoUrl(leader.photoUrl)
      setCategory(leader.category)
      setBranch(leader.branch || '')
      setOrganization(leader.organization)
      setIsActive(leader.isActive)
    }
  }, [leader])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        name,
        title,
        photoUrl,
        category,
        branch: branch || null,
        organization,
        isActive,
      })
    } catch {
      setError('Failed to save leader')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          {leader ? 'Edit Leader' : 'Add Leader'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {leader && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/LeaderForm.tsx
git commit -m "feat: add LeaderForm component for add/edit modal"
```

---

## Task 12: Create Delete Dialog Component

**Files:**
- Create: `components/admin/DeleteDialog.tsx`

**Step 1: Create delete dialog component**

```typescript
'use client'

import { useState } from 'react'

interface DeleteDialogProps {
  leaderName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteDialog({ leaderName, onConfirm, onCancel }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Delete Leader</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{leaderName}</strong>? This will
          mark them as inactive.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/DeleteDialog.tsx
git commit -m "feat: add DeleteDialog component"
```

---

## Task 13: Create Diff Modal Component

**Files:**
- Create: `components/admin/DiffModal.tsx`

**Step 1: Create diff modal component**

```typescript
'use client'

import { useState } from 'react'

interface LeaderDiff {
  name: string
  title: string
  category: string
  branch: string | null
}

interface DiffData {
  additions: LeaderDiff[]
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
  previewToken: string
}

interface DiffModalProps {
  diff: DiffData
  onApply: (token: string) => Promise<void>
  onCancel: () => void
}

export function DiffModal({ diff, onApply, onCancel }: DiffModalProps) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  const totalChanges =
    diff.additions.length + diff.updates.length + diff.removals.length

  async function handleApply() {
    setApplying(true)
    setError('')
    try {
      await onApply(diff.previewToken)
    } catch {
      setError('Failed to apply changes')
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Review AI Changes</h2>
          <p className="text-gray-600 mt-1">
            Found {diff.additions.length} additions, {diff.updates.length} updates,{' '}
            {diff.removals.length} removals
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
          )}

          {totalChanges === 0 && (
            <p className="text-gray-500 text-center py-8">
              No changes detected. Data is up to date.
            </p>
          )}

          {diff.additions.length > 0 && (
            <section>
              <h3 className="font-semibold text-green-700 mb-3">
                New Leaders ({diff.additions.length})
              </h3>
              <div className="space-y-2">
                {diff.additions.map((leader, i) => (
                  <div
                    key={i}
                    className="bg-green-50 border border-green-200 rounded p-3"
                  >
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-gray-600">{leader.title}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {diff.updates.length > 0 && (
            <section>
              <h3 className="font-semibold text-yellow-700 mb-3">
                Updated Leaders ({diff.updates.length})
              </h3>
              <div className="space-y-2">
                {diff.updates.map((update) => (
                  <div
                    key={update.id}
                    className="bg-yellow-50 border border-yellow-200 rounded p-3"
                  >
                    <p className="font-medium mb-2">{update.name}</p>
                    {update.changes.map((change, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-500">{change.field}:</span>{' '}
                        <span className="line-through text-red-600">
                          {change.current}
                        </span>{' '}
                        →{' '}
                        <span className="text-green-600">{change.proposed}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {diff.removals.length > 0 && (
            <section>
              <h3 className="font-semibold text-red-700 mb-3">
                Removed Leaders ({diff.removals.length})
              </h3>
              <div className="space-y-2">
                {diff.removals.map((leader) => (
                  <div
                    key={leader.id}
                    className="bg-red-50 border border-red-200 rounded p-3"
                  >
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-gray-600">{leader.title}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          {totalChanges > 0 && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply All Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/DiffModal.tsx
git commit -m "feat: add DiffModal component for AI refresh review"
```

---

## Task 14: Create Admin Dashboard Page

**Files:**
- Create: `app/admin/page.tsx`

**Step 1: Create admin dashboard page**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { LeaderTable } from '@/components/admin/LeaderTable'
import { LeaderForm } from '@/components/admin/LeaderForm'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { DiffModal } from '@/components/admin/DiffModal'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
  isActive: boolean
}

interface DiffData {
  additions: Array<{ name: string; title: string; category: string; branch: string | null }>
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
  previewToken: string
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'MILITARY_4STAR', label: '4-Star' },
  { value: 'MILITARY_3STAR', label: '3-Star' },
  { value: 'MAJOR_COMMAND', label: 'Major Command' },
  { value: 'SERVICE_SECRETARY', label: 'Service Secretary' },
  { value: 'CIVILIAN_SES', label: 'Civilian SES' },
  { value: 'APPOINTEE', label: 'Appointee' },
  { value: 'SECRETARIAT', label: 'Secretariat' },
]

const BRANCHES = [
  { value: '', label: 'All Branches' },
  { value: 'ARMY', label: 'Army' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'AIR_FORCE', label: 'Air Force' },
  { value: 'MARINE_CORPS', label: 'Marine Corps' },
  { value: 'SPACE_FORCE', label: 'Space Force' },
  { value: 'COAST_GUARD', label: 'Coast Guard' },
]

export default function AdminPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [branch, setBranch] = useState('')
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)

  const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingLeader, setDeletingLeader] = useState<Leader | null>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [diffData, setDiffData] = useState<DiffData | null>(null)

  const fetchLeaders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (branch) params.set('branch', branch)
    if (search) params.set('search', search)
    if (includeInactive) params.set('includeInactive', 'true')

    const res = await fetch(`/api/admin/leaders?${params}`)
    const data = await res.json()
    setLeaders(data)
    setLoading(false)
  }, [category, branch, search, includeInactive])

  useEffect(() => {
    fetchLeaders()
  }, [fetchLeaders])

  async function handleSaveLeader(data: Partial<Leader>) {
    const isEdit = editingLeader !== null
    const url = isEdit
      ? `/api/admin/leaders/${editingLeader.id}`
      : '/api/admin/leaders'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Save failed')

    setEditingLeader(null)
    setShowAddForm(false)
    fetchLeaders()
  }

  async function handleDeleteLeader() {
    if (!deletingLeader) return

    const res = await fetch(`/api/admin/leaders/${deletingLeader.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Delete failed')

    setDeletingLeader(null)
    fetchLeaders()
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/preview-refresh', { method: 'POST' })
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      setDiffData(data)
    } catch (error) {
      console.error('Refresh error:', error)
      alert('Failed to fetch updates')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleApplyDiff(token: string) {
    const res = await fetch('/api/admin/apply-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewToken: token }),
    })

    if (!res.ok) throw new Error('Apply failed')

    setDiffData(null)
    fetchLeaders()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Leader
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? 'Fetching...' : 'Refresh from AI'}
        </button>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span className="text-sm">Show inactive</span>
        </label>
      </div>

      {/* Leader Table */}
      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading...</p>
      ) : (
        <LeaderTable
          leaders={leaders}
          onEdit={setEditingLeader}
          onDelete={setDeletingLeader}
        />
      )}

      {/* Modals */}
      {(showAddForm || editingLeader) && (
        <LeaderForm
          leader={editingLeader}
          onSave={handleSaveLeader}
          onCancel={() => {
            setShowAddForm(false)
            setEditingLeader(null)
          }}
        />
      )}

      {deletingLeader && (
        <DeleteDialog
          leaderName={deletingLeader.name}
          onConfirm={handleDeleteLeader}
          onCancel={() => setDeletingLeader(null)}
        />
      )}

      {diffData && (
        <DiffModal
          diff={diffData}
          onApply={handleApplyDiff}
          onCancel={() => setDiffData(null)}
        />
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin dashboard page with full functionality"
```

---

## Task 15: Update Environment Variables Documentation

**Files:**
- Modify: `.env.example` (create if doesn't exist)

**Step 1: Check for .env.example**

```bash
cat .env.example 2>/dev/null || echo "File does not exist"
```

**Step 2: Create/update .env.example**

Add these variables:

```
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_SECRET=random-32-character-string-here
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add admin env vars to .env.example"
```

---

## Task 16: Final Verification

**Step 1: Verify all TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 2: Verify file structure**

```bash
ls -la app/admin/
ls -la app/api/admin/
ls -la components/admin/
ls -la lib/admin-auth.ts
ls -la middleware.ts
```
Expected: All files exist

**Step 3: Create summary commit**

```bash
git log --oneline -15
```

Review commits are in order. Feature is complete.

---

## Environment Variables Checklist

Before testing, ensure these are set:

```
ADMIN_USERNAME=<your-username>
ADMIN_PASSWORD=<your-password>
ADMIN_SECRET=<random-string-for-jwt>
```

## Manual Testing Checklist

1. Visit `/admin` → Should redirect to `/admin/login`
2. Login with wrong credentials → Should show error
3. Login with correct credentials → Should redirect to `/admin`
4. View leader table → Should show all leaders
5. Click "Add Leader" → Form should open
6. Add a new leader → Should appear in table
7. Click "Edit" → Form should pre-fill
8. Update a leader → Changes should save
9. Click "Delete" → Confirmation should appear
10. Confirm delete → Leader should be marked inactive
11. Click "Refresh from AI" → Should show diff modal
12. Click "Apply All" → Changes should apply
13. Click "Logout" → Should return to login page
