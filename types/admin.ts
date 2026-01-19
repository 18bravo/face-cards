import type { Leader as PrismaLeader, Category, Branch } from '@prisma/client'

// Re-export Prisma types for use in components
export type Leader = PrismaLeader
export type { Category, Branch }

// Constants derived from Prisma enums
export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'MILITARY_4STAR', label: '4-Star Military' },
  { value: 'MILITARY_3STAR', label: '3-Star Military' },
  { value: 'MAJOR_COMMAND', label: 'Major Command' },
  { value: 'SERVICE_SECRETARY', label: 'Service Secretary' },
  { value: 'CIVILIAN_SES', label: 'Civilian SES' },
  { value: 'APPOINTEE', label: 'Appointee' },
  { value: 'SECRETARIAT', label: 'Secretariat' },
]

export const BRANCHES: { value: Branch; label: string }[] = [
  { value: 'ARMY', label: 'Army' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'AIR_FORCE', label: 'Air Force' },
  { value: 'MARINE_CORPS', label: 'Marine Corps' },
  { value: 'SPACE_FORCE', label: 'Space Force' },
  { value: 'COAST_GUARD', label: 'Coast Guard' },
]

// Helper to get label from value
export function getCategoryLabel(value: Category): string {
  return CATEGORIES.find(c => c.value === value)?.label ?? value
}

export function getBranchLabel(value: Branch | null): string {
  if (!value) return '-'
  return BRANCHES.find(b => b.value === value)?.label ?? value
}
