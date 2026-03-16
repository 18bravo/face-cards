import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  theater: z.enum(['INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM', 'GLOBAL']),
})

export async function GET() {
  try {
    const scenarios = await prisma.scenario.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { units: true } },
      },
    })

    return NextResponse.json({
      scenarios: scenarios.map((s: { id: string; name: string; theater: string; status: string; _count: { units: number }; currentTick: number; startDate: Date }) => ({
        id: s.id,
        name: s.name,
        theater: s.theater,
        status: s.status,
        unitCount: s._count.units,
        currentTick: s.currentTick,
        startDate: s.startDate.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch scenarios:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createScenarioSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const scenario = await prisma.scenario.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        theater: parsed.data.theater,
      },
    })

    await audit({
      action: 'scenario.create',
      resource: `scenario:${scenario.id}`,
      details: { name: scenario.name, theater: scenario.theater },
      scenarioId: scenario.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ scenario }, { status: 201 })
  } catch (error) {
    console.error('Failed to create scenario:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
