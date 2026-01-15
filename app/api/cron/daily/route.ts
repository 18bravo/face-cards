import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchLeaderData } from '@/lib/openai'

// Key positions to check daily
const KEY_POSITIONS = [
  'Secretary of Defense',
  'Chairman of the Joint Chiefs of Staff',
  'Chief of Staff of the Army',
  'Chief of Naval Operations',
  'Chief of Staff of the Air Force',
  'Commandant of the Marine Corps',
]

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let checked = 0
  let updated = 0

  for (const position of KEY_POSITIONS) {
    const data = await fetchLeaderData(position)
    if (!data) continue

    checked++
    const id = `${data.title}-${data.organization}`.toLowerCase().replace(/\s+/g, '-')

    const existing = await prisma.leader.findFirst({
      where: { title: data.title, isActive: true },
    })

    if (existing && existing.name !== data.name) {
      await prisma.leader.update({
        where: { id: existing.id },
        data: { isActive: false },
      })
      await prisma.leader.create({
        data: {
          name: data.name,
          title: data.title,
          photoUrl: data.photoUrl,
          category: data.category,
          branch: data.branch,
          organization: data.organization,
        },
      })
      updated++
    } else if (existing) {
      await prisma.leader.update({
        where: { id: existing.id },
        data: { lastVerified: new Date() },
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return NextResponse.json({
    type: 'daily',
    checked,
    updated,
    timestamp: new Date().toISOString(),
  })
}
