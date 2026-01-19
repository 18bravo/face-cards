import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

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
