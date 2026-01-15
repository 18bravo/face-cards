import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Category, Branch } from '@prisma/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') as Category | null
  const branch = searchParams.get('branch') as Branch | null
  const organization = searchParams.get('organization')

  const where: {
    isActive: boolean
    category?: Category
    branch?: Branch
    organization?: string
  } = {
    isActive: true,
  }

  if (category) where.category = category
  if (branch) where.branch = branch
  if (organization) where.organization = organization

  const leaders = await prisma.leader.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  })

  return NextResponse.json(leaders)
}
