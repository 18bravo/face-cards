// ── Core domain types for EnderAI ─────────────────────────

export interface Position {
  latitude: number
  longitude: number
  altitude?: number
}

export interface UnitMarker {
  id: string
  designation: string
  unitType: string
  faction: 'BLUE' | 'RED' | 'GREEN' | 'NEUTRAL'
  position: Position
  heading: number
  speed: number
  strength: number
  readiness: number
  status: string
  echelon: string
}

export interface TheaterBounds {
  name: string
  center: Position
  zoomLevel: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface ScenarioSummary {
  id: string
  name: string
  theater: string
  status: string
  unitCount: number
  currentTick: number
  startDate: string
}

export interface SimulationConfig {
  agentCount: number
  model: string
  seedPrompt: string
  tickInterval: number
  factions: string[]
  environmentFactors: {
    weather: boolean
    terrain: boolean
    logistics: boolean
    cyberDomain: boolean
  }
}

export interface SimulationResult {
  id: string
  status: string
  agentCount: number
  summary: string | null
  events: SimulationEvent[]
  predictions: Prediction[]
}

export interface SimulationEvent {
  tick: number
  type: string
  title: string
  description: string
  position?: Position
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'FLASH'
}

export interface Prediction {
  label: string
  probability: number
  description: string
  timeframe: string
}

// ── MIL-STD-2525 Symbol Codes (simplified) ──────────────────

export const FACTION_COLORS = {
  BLUE: '#3b82f6',
  RED: '#ef4444',
  GREEN: '#22c55e',
  NEUTRAL: '#f59e0b',
} as const

export const UNIT_TYPE_ICONS: Record<string, string> = {
  INFANTRY: '⚔',
  ARMOR: '◆',
  ARTILLERY: '●',
  AIR_DEFENSE: '⊕',
  AVIATION: '✈',
  NAVAL_SURFACE: '⚓',
  NAVAL_SUBSURFACE: '▽',
  CARRIER_GROUP: '⬟',
  SPECIAL_OPERATIONS: '⍟',
  CYBER: '⌘',
  MISSILE: '↑',
  AIR_FIGHTER: '△',
  AIR_BOMBER: '▲',
  UAV: '◇',
  LOGISTICS: '⊞',
  COMMAND: '★',
}

// ── Theater presets ─────────────────────────────────────────

export const THEATERS: Record<string, TheaterBounds> = {
  INDOPACOM: {
    name: 'Indo-Pacific Command',
    center: { latitude: 20, longitude: 145 },
    zoomLevel: 4,
    bounds: { north: 55, south: -40, east: -150, west: 60 },
  },
  EUCOM: {
    name: 'European Command',
    center: { latitude: 50, longitude: 15 },
    zoomLevel: 5,
    bounds: { north: 72, south: 30, east: 60, west: -30 },
  },
  CENTCOM: {
    name: 'Central Command',
    center: { latitude: 30, longitude: 50 },
    zoomLevel: 5,
    bounds: { north: 45, south: 10, east: 75, west: 25 },
  },
  AFRICOM: {
    name: 'Africa Command',
    center: { latitude: 5, longitude: 20 },
    zoomLevel: 4,
    bounds: { north: 37, south: -35, east: 55, west: -20 },
  },
  SOUTHCOM: {
    name: 'Southern Command',
    center: { latitude: -5, longitude: -65 },
    zoomLevel: 4,
    bounds: { north: 20, south: -60, east: -30, west: -100 },
  },
  NORTHCOM: {
    name: 'Northern Command',
    center: { latitude: 45, longitude: -100 },
    zoomLevel: 4,
    bounds: { north: 75, south: 15, east: -50, west: -170 },
  },
  GLOBAL: {
    name: 'Global View',
    center: { latitude: 20, longitude: 0 },
    zoomLevel: 2,
    bounds: { north: 90, south: -90, east: 180, west: -180 },
  },
}
