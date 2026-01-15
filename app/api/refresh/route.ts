import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllLeaders } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.REFRESH_SECRET}`

  if (!process.env.REFRESH_SECRET) {
    return NextResponse.json(
      { error: 'REFRESH_SECRET not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const leaders = await fetchAllLeaders()
    let updated = 0
    let added = 0

    for (const leader of leaders) {
      const id = `${leader.title}-${leader.organization}`.toLowerCase().replace(/\s+/g, '-')

      const existing = await prisma.leader.findUnique({ where: { id } })

      if (existing) {
        if (existing.name !== leader.name) {
          // Position holder changed - mark old as inactive, create new
          await prisma.leader.update({
            where: { id },
            data: { isActive: false },
          })
          await prisma.leader.create({
            data: {
              name: leader.name,
              title: leader.title,
              photoUrl: leader.photoUrl,
              category: leader.category,
              branch: leader.branch,
              organization: leader.organization,
            },
          })
          updated++
        } else {
          // Same person - update lastVerified
          await prisma.leader.update({
            where: { id },
            data: { lastVerified: new Date() },
          })
        }
      } else {
        // New position
        await prisma.leader.create({
          data: {
            id,
            name: leader.name,
            title: leader.title,
            photoUrl: leader.photoUrl,
            category: leader.category,
            branch: leader.branch,
            organization: leader.organization,
          },
        })
        added++
      }
    }

    return NextResponse.json({
      message: 'Refresh complete',
      updated,
      added,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Refresh failed' },
      { status: 500 }
    )
  }
}
