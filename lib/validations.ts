import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  theater: z.enum(['INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM', 'GLOBAL']),
})

export const createUnitSchema = z.object({
  name: z.string().min(1).max(200),
  designation: z.string().min(1).max(200),
  unitType: z.string(),
  branch: z.string(),
  echelon: z.string(),
  strength: z.number().int().positive(),
  readiness: z.number().min(0).max(1).default(1.0),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().default(0),
  heading: z.number().min(0).max(360).default(0),
  speed: z.number().min(0).default(0),
  faction: z.enum(['BLUE', 'RED', 'GREEN', 'NEUTRAL']),
  scenarioId: z.string(),
})

export const moveUnitSchema = z.object({
  unitId: z.string(),
  destLat: z.number().min(-90).max(90),
  destLon: z.number().min(-180).max(180),
  orderType: z.enum(['MOVE', 'ATTACK', 'DEFEND', 'PATROL', 'WITHDRAW', 'SUPPORT', 'RESUPPLY', 'RECON']),
})

export const addFeedSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  category: z.enum(['DEFENSE', 'GEOPOLITICS', 'INTELLIGENCE', 'TECHNOLOGY', 'CONFLICT', 'DIPLOMACY', 'ECONOMICS', 'CYBER']),
})
