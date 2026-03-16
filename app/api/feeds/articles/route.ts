import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

  try {
    const articles = await prisma.feedArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        feed: { select: { name: true } },
      },
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
