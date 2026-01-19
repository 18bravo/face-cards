import { z } from 'zod'

// Auth validation
export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
})

// Leader validation - must match Prisma enums
const categoryEnum = z.enum([
  'MILITARY_4STAR',
  'MILITARY_3STAR',
  'MAJOR_COMMAND',
  'SERVICE_SECRETARY',
  'CIVILIAN_SES',
  'APPOINTEE',
  'SECRETARIAT',
])
const branchEnum = z.enum([
  'ARMY',
  'NAVY',
  'AIR_FORCE',
  'MARINE_CORPS',
  'SPACE_FORCE',
  'COAST_GUARD',
]).nullable()

export const createLeaderSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  photoUrl: z.string().url().max(2000),
  category: categoryEnum,
  branch: branchEnum.optional(),
  organization: z.string().min(1).max(500),
  isActive: z.boolean().optional().default(true),
})

export const updateLeaderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(500).optional(),
  photoUrl: z.string().url().max(2000).optional(),
  category: categoryEnum.optional(),
  branch: branchEnum.optional(),
  organization: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
})

// Whitelist of allowed fields for leader updates (used in apply-refresh)
export const ALLOWED_LEADER_FIELDS = ['name', 'title', 'photoUrl', 'category', 'branch', 'organization', 'isActive'] as const

// Apply refresh token validation
export const applyRefreshSchema = z.object({
  previewToken: z.string().min(1),
})

// Preview data validation schema (for data stored in database)
export const previewDataSchema = z.object({
  additions: z.array(z.object({
    name: z.string(),
    title: z.string(),
    photoUrl: z.string(),
    category: categoryEnum,
    branch: branchEnum,
    organization: z.string(),
  })),
  updates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    changes: z.array(z.object({
      field: z.string(),
      current: z.string(),
      proposed: z.string(),
    })),
  })),
  removals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
  })),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateLeaderInput = z.infer<typeof createLeaderSchema>
export type UpdateLeaderInput = z.infer<typeof updateLeaderSchema>
export type PreviewDataInput = z.infer<typeof previewDataSchema>
