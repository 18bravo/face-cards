import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const createUnitSchema = z.object({
  name: z.string().min(1).max(200),
  designation: z.string().min(1).max(200),
  unitType: z.string(),
  branch: z.string(),
  echelon: z.string(),
  strength: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  faction: z.enum(['BLUE', 'RED', 'GREEN', 'NEUTRAL']),
  scenarioId: z.string(),
})

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get('scenarioId')

  try {
    const units = await prisma.militaryUnit.findMany({
      where: scenarioId ? { scenarioId } : {},
      orderBy: { faction: 'asc' },
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error('Failed to fetch units:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createUnitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const unit = await prisma.militaryUnit.create({
      data: parsed.data as Parameters<typeof prisma.militaryUnit.create>[0]['data'],
    })

    await audit({
      action: 'unit.create',
      resource: `unit:${unit.id}`,
      details: { designation: unit.designation, faction: unit.faction },
      scenarioId: unit.scenarioId || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ unit }, { status: 201 })
  } catch (error) {
    console.error('Failed to create unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
