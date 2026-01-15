import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllLeaders } from '@/lib/openai'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leaders = await fetchAllLeaders()
  let updated = 0
  let added = 0

  for (const leader of leaders) {
    const existing = await prisma.leader.findFirst({
      where: { title: leader.title, isActive: true },
    })

    if (existing) {
      if (existing.name !== leader.name) {
        await prisma.leader.update({
          where: { id: existing.id },
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
        await prisma.leader.update({
          where: { id: existing.id },
          data: { lastVerified: new Date() },
        })
      }
    } else {
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
      added++
    }
  }

  return NextResponse.json({
    type: 'weekly',
    total: leaders.length,
    updated,
    added,
    timestamp: new Date().toISOString(),
  })
}
