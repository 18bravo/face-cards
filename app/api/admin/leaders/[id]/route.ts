import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { updateLeaderSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const leader = await prisma.leader.findUnique({
    where: { id },
  })

  if (!leader) {
    return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
  }

  return NextResponse.json(leader)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const result = updateLeaderSchema.safeParse(body)

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
    const leader = await prisma.leader.update({
      where: { id },
      data,
    })

    return NextResponse.json(leader)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('Update leader error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to update leader' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Soft delete - mark as inactive
    await prisma.leader.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('Delete leader error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to delete leader' },
      { status: 500 }
    )
  }
}
