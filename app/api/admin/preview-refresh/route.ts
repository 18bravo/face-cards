import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'
import { fetchAllLeaders, LeaderData } from '@/lib/openai'

interface DiffResult {
  additions: LeaderData[]
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
    const additions: LeaderData[] = []
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
