import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const data = await request.json()

    const leader = await prisma.leader.update({
      where: { id },
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

    return NextResponse.json(leader)
  } catch (error) {
    console.error('Update leader error:', error)
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
    console.error('Delete leader error:', error)
    return NextResponse.json(
      { error: 'Failed to delete leader' },
      { status: 500 }
    )
  }
}
