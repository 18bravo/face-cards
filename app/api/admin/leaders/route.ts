import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const branch = searchParams.get('branch')
  const search = searchParams.get('search')
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const where: Record<string, unknown> = {}

  if (!includeInactive) {
    where.isActive = true
  }

  if (category) {
    where.category = category
  }

  if (branch) {
    where.branch = branch
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ]
  }

  const leaders = await prisma.leader.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(leaders)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const leader = await prisma.leader.create({
      data: {
        name: data.name,
        title: data.title,
        photoUrl: data.photoUrl,
        category: data.category,
        branch: data.branch || null,
        organization: data.organization,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(leader, { status: 201 })
  } catch (error) {
    console.error('Create leader error:', error)
    return NextResponse.json(
      { error: 'Failed to create leader' },
      { status: 500 }
    )
  }
}
