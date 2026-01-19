import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { applyRefreshSchema, previewDataSchema, ALLOWED_LEADER_FIELDS, PreviewDataInput } from '@/lib/validations'

interface TokenPayload {
  type: string
  previewId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = applyRefreshSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { previewToken } = result.data

    // Verify and decode token
    const secret = new TextEncoder().encode(process.env.ADMIN_SECRET)
    let previewId: string

    try {
      const { payload: verified } = await jwtVerify(previewToken, secret)
      const tokenPayload = verified as unknown as TokenPayload

      if (tokenPayload.type !== 'preview' || !tokenPayload.previewId) {
        throw new Error('Invalid token type')
      }
      previewId = tokenPayload.previewId
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired preview token' },
        { status: 400 }
      )
    }

    // Fetch preview data from database
    const preview = await prisma.previewData.findUnique({
      where: { id: previewId },
    })

    if (!preview || preview.expiresAt < new Date()) {
      // Clean up expired preview if found
      if (preview) {
        await prisma.previewData.delete({ where: { id: previewId } })
      }
      return NextResponse.json(
        { error: 'Preview has expired. Please generate a new preview.' },
        { status: 400 }
      )
    }

    // Validate the preview data structure
    const dataResult = previewDataSchema.safeParse(preview.data)
    if (!dataResult.success) {
      await prisma.previewData.delete({ where: { id: previewId } })
      return NextResponse.json(
        { error: 'Invalid preview data' },
        { status: 400 }
      )
    }

    const previewData: PreviewDataInput = dataResult.data

    // Apply changes in a transaction
    await prisma.$transaction(async (tx) => {
      // Apply additions
      for (const addition of previewData.additions) {
        await tx.leader.create({
          data: {
            name: addition.name,
            title: addition.title,
            photoUrl: addition.photoUrl,
            category: addition.category,
            branch: addition.branch,
            organization: addition.organization,
            isActive: true,
          },
        })
      }

      // Apply updates (only whitelisted fields)
      for (const update of previewData.updates) {
        const data: Record<string, string> = {}
        for (const change of update.changes) {
          // Only allow whitelisted fields to prevent injection
          if (ALLOWED_LEADER_FIELDS.includes(change.field as typeof ALLOWED_LEADER_FIELDS[number])) {
            data[change.field] = change.proposed
          }
        }
        if (Object.keys(data).length > 0) {
          await tx.leader.update({
            where: { id: update.id },
            data,
          })
        }
      }

      // Apply removals (soft delete)
      for (const removal of previewData.removals) {
        await tx.leader.update({
          where: { id: removal.id },
          data: { isActive: false },
        })
      }

      // Delete the preview data after applying
      await tx.previewData.delete({ where: { id: previewId } })
    })

    return NextResponse.json({
      success: true,
      applied: {
        additions: previewData.additions.length,
        updates: previewData.updates.length,
        removals: previewData.removals.length,
      },
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Apply refresh error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to apply changes' },
      { status: 500 }
    )
  }
}
