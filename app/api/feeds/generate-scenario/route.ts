import { NextRequest, NextResponse } from 'next/server'
import { generateScenarioFromArticles } from '@/lib/feeds'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const generateSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(20),
  theater: z.enum(['INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM', 'GLOBAL']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = generateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const scenarioId = await generateScenarioFromArticles(parsed.data.articleIds, parsed.data.theater)

    await audit({
      action: 'scenario.create',
      resource: `scenario:${scenarioId}`,
      details: {
        source: 'feed_generation',
        articleCount: parsed.data.articleIds.length,
        theater: parsed.data.theater,
      },
      scenarioId,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ scenarioId }, { status: 201 })
  } catch (error) {
    console.error('Scenario generation failed:', error)
    return NextResponse.json({ error: 'Scenario generation failed' }, { status: 500 })
  }
}
