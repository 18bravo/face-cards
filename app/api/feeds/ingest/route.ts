import { NextResponse } from 'next/server'
import { ingestAllFeeds } from '@/lib/feeds'
import { audit } from '@/lib/audit'

export async function POST() {
  try {
    const result = await ingestAllFeeds()

    await audit({
      action: 'data.import',
      resource: 'feeds:all',
      details: result,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Feed ingestion failed:', error)
    return NextResponse.json({ error: 'Feed ingestion failed' }, { status: 500 })
  }
}
