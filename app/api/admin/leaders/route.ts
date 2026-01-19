import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLeaderSchema } from '@/lib/validations'

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
    const body = await request.json()
    const result = createLeaderSchema.safeParse(body)

    if (!result.success) {
      const error = process.env.NODE_ENV === 'production'
        ? 'Invalid input'
        : result.error.flatten()
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    const data = result.data
    const leader = await prisma.leader.create({
      data: {
        name: data.name,
        title: data.title,
        photoUrl: data.photoUrl,
        category: data.category,
        branch: data.branch || null,
        organization: data.organization,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(leader, { status: 201 })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Create leader error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to create leader' },
      { status: 500 }
    )
  }
}
