import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { buildWorldConfig, launchSimulation } from '@/lib/mirofish'
import { z } from 'zod'

const launchSchema = z.object({
  scenarioId: z.string(),
  agentCount: z.number().int().min(10).max(10000).default(100),
  model: z.string().default('gpt-4o'),
  environmentFactors: z.object({
    weather: z.boolean().default(true),
    terrain: z.boolean().default(true),
    logistics: z.boolean().default(true),
    cyberDomain: z.boolean().default(false),
  }).default({ weather: true, terrain: true, logistics: true, cyberDomain: false }),
})

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get('scenarioId')

  try {
    const simulations = await prisma.simulation.findMany({
      where: scenarioId ? { scenarioId } : {},
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ simulations })
  } catch (error) {
    console.error('Failed to fetch simulations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = launchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    // Fetch scenario with units
    const scenario = await prisma.scenario.findUnique({
      where: { id: parsed.data.scenarioId },
      include: { units: true },
    })

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Build unit disposition string for MiroFish
    const unitData = scenario.units.map((u: { faction: string; designation: string; unitType: string; echelon: string; strength: number; latitude: number; longitude: number; status: string; readiness: number }) =>
      `[${u.faction}] ${u.designation} (${u.unitType}, ${u.echelon}) - STR:${u.strength}, ` +
      `POS:${u.latitude.toFixed(2)},${u.longitude.toFixed(2)}, STATUS:${u.status}, READINESS:${(u.readiness * 100).toFixed(0)}%`
    ).join('\n')

    // Determine factions present
    const factionSet = new Set<string>()
    for (const u of scenario.units as Array<{ faction: string }>) {
      factionSet.add(u.faction)
    }
    const factions = Array.from(factionSet)

    // Build MiroFish world config
    const worldConfig = buildWorldConfig(
      scenario.description,
      {
        agentCount: parsed.data.agentCount,
        model: parsed.data.model,
        seedPrompt: scenario.description,
        tickInterval: scenario.tickIntervalMs,
        factions,
        environmentFactors: parsed.data.environmentFactors,
      },
      unitData
    )

    // Create simulation record
    const simulation = await prisma.simulation.create({
      data: {
        scenarioId: scenario.id,
        agentCount: parsed.data.agentCount,
        model: parsed.data.model,
        seedPrompt: scenario.description,
        config: JSON.parse(JSON.stringify(worldConfig)),
        status: 'INITIALIZING',
        startedAt: new Date(),
      },
    })

    // Launch MiroFish simulation (async — will update status via webhook or polling)
    try {
      const mirofishId = await launchSimulation(worldConfig)
      await prisma.simulation.update({
        where: { id: simulation.id },
        data: { status: 'RUNNING', config: JSON.parse(JSON.stringify({ ...worldConfig, mirofishId })) },
      })
    } catch {
      // MiroFish not available — simulation stays in INITIALIZING for manual connection
      console.warn('MiroFish not reachable — simulation created in offline mode')
    }

    await audit({
      action: 'simulation.launch',
      resource: `simulation:${simulation.id}`,
      details: { agentCount: parsed.data.agentCount, model: parsed.data.model },
      scenarioId: scenario.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error) {
    console.error('Simulation launch failed:', error)
    return NextResponse.json({ error: 'Simulation launch failed' }, { status: 500 })
  }
}
