/**
 * Simulation Tick Engine
 *
 * Client-side simulation loop that advances the scenario state:
 * - Moves units along waypoints
 * - Resolves engagements between opposing forces
 * - Generates events (detection, engagement, casualty, supply)
 * - Tracks fog-of-war detection ranges
 * - Models logistics/supply degradation
 */

import type { UnitMarker, SimulationEvent, Position } from '@/types/military'

// ── Constants ───────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371

// Detection ranges by unit type (km)
const DETECTION_RANGES: Record<string, number> = {
  AIR_ISR: 500,
  AIR_FIGHTER: 300,
  NAVAL_SURFACE: 200,
  CARRIER_GROUP: 250,
  AIR_DEFENSE: 150,
  RADAR: 400,
  COMMAND: 100,
  CYBER: 9999, // global
  UAV: 350,
  DEFAULT: 80,
}

// Engagement ranges by unit type (km)
const ENGAGEMENT_RANGES: Record<string, number> = {
  MISSILE: 1500,
  ARTILLERY: 40,
  AIR_FIGHTER: 200,
  AIR_BOMBER: 500,
  NAVAL_SURFACE: 150,
  CARRIER_GROUP: 300,
  AIR_DEFENSE: 100,
  ARMOR: 5,
  INFANTRY: 3,
  SPECIAL_OPERATIONS: 2,
  DEFAULT: 10,
}

// Speed in km per tick (1 tick ~ 1 hour)
const UNIT_SPEEDS: Record<string, number> = {
  AIR_FIGHTER: 900,
  AIR_BOMBER: 800,
  AIR_TRANSPORT: 700,
  AIR_ISR: 600,
  UAV: 400,
  CARRIER_GROUP: 55,
  NAVAL_SURFACE: 55,
  NAVAL_SUBSURFACE: 45,
  AMPHIBIOUS: 35,
  ARMOR: 40,
  INFANTRY: 25,
  ARTILLERY: 20,
  LOGISTICS: 30,
  SPECIAL_OPERATIONS: 30,
  COMMAND: 15,
  DEFAULT: 20,
}

// Combat power multipliers by unit type
const COMBAT_POWER: Record<string, number> = {
  CARRIER_GROUP: 10.0,
  MISSILE: 8.0,
  AIR_FIGHTER: 6.0,
  AIR_BOMBER: 7.0,
  ARMOR: 5.0,
  AIR_DEFENSE: 4.0,
  NAVAL_SURFACE: 4.5,
  NAVAL_SUBSURFACE: 5.5,
  INFANTRY: 3.0,
  ARTILLERY: 4.5,
  AMPHIBIOUS: 3.5,
  SPECIAL_OPERATIONS: 6.0,
  CYBER: 2.0,
  LOGISTICS: 0.5,
  COMMAND: 1.0,
  DEFAULT: 2.0,
}

// ── Types ───────────────────────────────────────────────────

export interface UnitOrder {
  unitId: string
  type: 'MOVE' | 'ATTACK' | 'DEFEND' | 'PATROL' | 'WITHDRAW' | 'SUPPORT' | 'RECON'
  destination: Position
  targetId?: string // for ATTACK orders
}

export interface SupplyState {
  unitId: string
  supplyLevel: number       // 0-1, decreases when far from LOGISTICS units
  lastResupplyTick: number
  distanceToSupply: number  // km to nearest friendly LOGISTICS unit
}

export type WeatherCondition = 'CLEAR' | 'OVERCAST' | 'RAIN' | 'STORM' | 'FOG'
export type TerrainType = 'OPEN' | 'URBAN' | 'MOUNTAIN' | 'FOREST' | 'COASTAL' | 'OCEAN' | 'DESERT'

export interface EnvironmentState {
  weather: WeatherCondition
  terrainAtPosition: (pos: Position) => TerrainType
}

// Weather effects on combat multipliers
const WEATHER_MODIFIERS: Record<WeatherCondition, { detection: number; speed: number; airPower: number }> = {
  CLEAR:    { detection: 1.0,  speed: 1.0,  airPower: 1.0 },
  OVERCAST: { detection: 0.9,  speed: 1.0,  airPower: 0.9 },
  RAIN:     { detection: 0.7,  speed: 0.85, airPower: 0.7 },
  STORM:    { detection: 0.4,  speed: 0.6,  airPower: 0.3 },
  FOG:      { detection: 0.3,  speed: 0.7,  airPower: 0.5 },
}

// Terrain effects: defense bonus and speed modifier
const TERRAIN_MODIFIERS: Record<TerrainType, { defenseBonus: number; speedMod: number; infantryBonus: number }> = {
  OPEN:     { defenseBonus: 1.0, speedMod: 1.0,  infantryBonus: 1.0 },
  URBAN:    { defenseBonus: 1.5, speedMod: 0.5,  infantryBonus: 1.4 },
  MOUNTAIN: { defenseBonus: 1.8, speedMod: 0.3,  infantryBonus: 1.3 },
  FOREST:   { defenseBonus: 1.4, speedMod: 0.6,  infantryBonus: 1.2 },
  COASTAL:  { defenseBonus: 1.1, speedMod: 0.9,  infantryBonus: 1.0 },
  OCEAN:    { defenseBonus: 1.0, speedMod: 1.0,  infantryBonus: 0.2 },
  DESERT:   { defenseBonus: 0.9, speedMod: 0.8,  infantryBonus: 0.8 },
}

// Simple terrain estimation from latitude/longitude
function estimateTerrain(pos: Position): TerrainType {
  const { latitude, longitude } = pos
  const absLat = Math.abs(latitude)

  // Ocean: very rough heuristic — known ocean areas
  // Taiwan Strait, Philippine Sea, Mediterranean, etc.
  if (absLat < 5 && (longitude > 100 || longitude < -30)) return 'OCEAN'
  if (latitude > 20 && latitude < 30 && longitude > 120 && longitude < 140) return 'OCEAN'
  if (latitude > 30 && latitude < 45 && longitude > -10 && longitude < 35) return 'COASTAL'

  // Mountain ranges (rough)
  if (absLat > 25 && absLat < 40 && longitude > 70 && longitude < 100) return 'MOUNTAIN' // Himalayas
  if (latitude > 35 && latitude < 50 && longitude > 5 && longitude < 20) return 'MOUNTAIN' // Alps

  // Deserts
  if (absLat > 15 && absLat < 35 && longitude > 20 && longitude < 60) return 'DESERT' // Sahara/Arabia

  // Forests
  if (absLat > 50 && longitude > 20 && longitude < 140) return 'FOREST' // Siberian taiga

  // Urban: major population centers (very approximate)
  if (latitude > 34 && latitude < 36 && longitude > 138 && longitude < 141) return 'URBAN' // Tokyo
  if (latitude > 39 && latitude < 41 && longitude > 115 && longitude < 118) return 'URBAN' // Beijing
  if (latitude > 23 && latitude < 26 && longitude > 119 && longitude < 122) return 'URBAN' // Taiwan

  return 'OPEN'
}

const defaultEnvironment: EnvironmentState = {
  weather: 'CLEAR',
  terrainAtPosition: estimateTerrain,
}

export interface SimulationState {
  tick: number
  units: UnitMarker[]
  orders: Map<string, UnitOrder>
  events: SimulationEvent[]
  detections: Map<string, Set<string>> // unitId -> detected enemy unitIds
  engagements: Engagement[]
  supply: Map<string, SupplyState>
  environment: EnvironmentState
  isRunning: boolean
  aiEnabled: { blue: boolean; red: boolean }
}

interface Engagement {
  id: string
  attackerId: string
  defenderId: string
  startTick: number
  location: Position
}

// ── Utility Functions ───────────────────────────────────────

function haversineDistance(a: Position, b: Position): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function bearing(from: Position, to: Position): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  const dLon = toRad(to.longitude - from.longitude)
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function moveToward(from: Position, to: Position, distanceKm: number): Position {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  const brng = toRad(bearing(from, to))
  const d = distanceKm / EARTH_RADIUS_KM
  const lat1 = toRad(from.latitude)
  const lon1 = toRad(from.longitude)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )

  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lon2),
    altitude: from.altitude,
  }
}

function getDetectionRange(unitType: string): number {
  return DETECTION_RANGES[unitType] ?? DETECTION_RANGES.DEFAULT
}

function getEngagementRange(unitType: string): number {
  return ENGAGEMENT_RANGES[unitType] ?? ENGAGEMENT_RANGES.DEFAULT
}

function getMaxSpeed(unitType: string): number {
  return UNIT_SPEEDS[unitType] ?? UNIT_SPEEDS.DEFAULT
}

function getCombatPower(unit: UnitMarker): number {
  const base = COMBAT_POWER[unit.unitType] ?? COMBAT_POWER.DEFAULT
  return base * unit.readiness * (unit.strength / 10000)
}

function isHostile(a: UnitMarker, b: UnitMarker): boolean {
  if (a.faction === b.faction) return false
  if (a.faction === 'NEUTRAL' || b.faction === 'NEUTRAL') return false
  // BLUE and GREEN are allied
  if (
    (a.faction === 'BLUE' && b.faction === 'GREEN') ||
    (a.faction === 'GREEN' && b.faction === 'BLUE')
  )
    return false
  return true
}

// ── Simulation Engine ───────────────────────────────────────

export function createInitialState(units: UnitMarker[], weather?: WeatherCondition): SimulationState {
  return {
    tick: 0,
    units: units.map(u => ({ ...u })),
    orders: new Map(),
    events: [],
    detections: new Map(),
    engagements: [],
    supply: new Map(),
    environment: { weather: weather ?? 'CLEAR', terrainAtPosition: estimateTerrain },
    isRunning: false,
    aiEnabled: { blue: false, red: true },
  }
}

/** Change weather condition mid-simulation */
export function setWeather(state: SimulationState, weather: WeatherCondition): SimulationState {
  return {
    ...state,
    environment: { ...state.environment, weather },
  }
}

export function issueOrder(state: SimulationState, order: UnitOrder): SimulationState {
  const newOrders = new Map(state.orders)
  newOrders.set(order.unitId, order)
  return { ...state, orders: newOrders }
}

/** Reset simulation back to initial units, clearing all state */
export function resetSimulation(initialUnits: UnitMarker[]): SimulationState {
  return createInitialState(initialUnits)
}

/** Serializable snapshot for save/restore */
export interface SimulationSnapshot {
  tick: number
  units: UnitMarker[]
  events: SimulationEvent[]
}

/** Take a snapshot of the current state */
export function takeSnapshot(state: SimulationState): SimulationSnapshot {
  return {
    tick: state.tick,
    units: state.units.map(u => ({ ...u })),
    events: [...state.events],
  }
}

/** Restore from a snapshot */
export function restoreSnapshot(snapshot: SimulationSnapshot): SimulationState {
  return {
    tick: snapshot.tick,
    units: snapshot.units.map(u => ({ ...u })),
    orders: new Map(),
    events: [...snapshot.events],
    detections: new Map(),
    engagements: [],
    supply: new Map(),
    environment: defaultEnvironment,
    isRunning: false,
    aiEnabled: { blue: false, red: true },
  }
}

/**
 * Faction AI — auto-issues orders for idle units of a given faction.
 * RED strategy: aggressive — attack nearest detected hostile, advance toward enemies.
 * BLUE strategy: defensive — engage hostiles that enter detection range, hold positions.
 */
function factionAI(
  faction: 'RED' | 'BLUE',
  units: UnitMarker[],
  orders: Map<string, UnitOrder>,
  detections: Map<string, Set<string>>,
): Map<string, UnitOrder> {
  const newOrders = new Map(orders)
  const isAggressive = faction === 'RED'

  for (const unit of units) {
    if (unit.faction !== faction) continue
    if (unit.status === 'DESTROYED') continue
    if (newOrders.has(unit.id)) continue
    if (unit.status === 'ENGAGED') continue

    let nearestEnemy: UnitMarker | null = null
    let nearestDist = Infinity

    const detected = detections.get(unit.id)
    const candidates = detected && detected.size > 0
      ? units.filter(u => detected.has(u.id) && u.status !== 'DESTROYED')
      : isAggressive
        ? units.filter(u => isHostile(unit, u) && u.status !== 'DESTROYED')
        : [] // BLUE only reacts to detected threats

    for (const enemy of candidates) {
      const dist = haversineDistance(unit.position, enemy.position)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestEnemy = enemy
      }
    }

    if (!nearestEnemy) continue

    const engRange = getEngagementRange(unit.unitType)
    const detRange = getDetectionRange(unit.unitType)

    // Static defense units hold position and only engage at range
    if (unit.unitType === 'MISSILE' || unit.unitType === 'AIR_DEFENSE' || unit.unitType === 'CYBER') {
      if (nearestDist <= engRange) {
        newOrders.set(unit.id, {
          unitId: unit.id,
          type: 'ATTACK',
          destination: nearestEnemy.position,
          targetId: nearestEnemy.id,
        })
      }
      continue
    }

    if (isAggressive) {
      // RED: attack if within 2x engagement range or 1.5x detection range
      if (nearestDist <= engRange * 2 || nearestDist <= detRange * 1.5) {
        newOrders.set(unit.id, {
          unitId: unit.id,
          type: 'ATTACK',
          destination: nearestEnemy.position,
          targetId: nearestEnemy.id,
        })
      }
    } else {
      // BLUE: defensive posture — engage threats within detection range
      if (nearestDist <= engRange * 1.5) {
        // Close threat — attack
        newOrders.set(unit.id, {
          unitId: unit.id,
          type: 'ATTACK',
          destination: nearestEnemy.position,
          targetId: nearestEnemy.id,
        })
      } else if (nearestDist <= detRange) {
        // Detected but not close — defend in place
        newOrders.set(unit.id, {
          unitId: unit.id,
          type: 'DEFEND',
          destination: unit.position,
        })
      }
    }
  }

  return newOrders
}

/** Calculate supply distances and degrade readiness for unsupplied units */
function updateSupplyLines(
  units: UnitMarker[],
  supply: Map<string, SupplyState>,
  tick: number,
  newEvents: SimulationEvent[],
): Map<string, SupplyState> {
  const newSupply = new Map<string, SupplyState>()
  const SUPPLY_RANGE_KM = 500 // max effective supply range
  const SUPPLY_DEGRADE_RATE = 0.01 // per tick when out of supply
  const SUPPLY_RECOVER_RATE = 0.02 // per tick when in supply

  for (const unit of units) {
    if (unit.status === 'DESTROYED') continue
    if (unit.unitType === 'LOGISTICS') continue // logistics units self-supply

    // Find nearest friendly LOGISTICS unit
    let minDist = Infinity
    for (const other of units) {
      if (other.status === 'DESTROYED') continue
      if (other.unitType !== 'LOGISTICS') continue
      if (other.faction !== unit.faction) continue
      const dist = haversineDistance(unit.position, other.position)
      if (dist < minDist) minDist = dist
    }

    const prev = supply.get(unit.id)
    const prevLevel = prev?.supplyLevel ?? 1.0

    let supplyLevel: number
    if (minDist <= SUPPLY_RANGE_KM) {
      supplyLevel = Math.min(1.0, prevLevel + SUPPLY_RECOVER_RATE)
    } else {
      supplyLevel = Math.max(0, prevLevel - SUPPLY_DEGRADE_RATE)
      // Apply readiness penalty when low on supply
      if (supplyLevel < 0.3) {
        unit.readiness = Math.max(0.1, unit.readiness - 0.005)
      }
    }

    // Supply warning events
    if (supplyLevel < 0.2 && (prevLevel >= 0.2 || !prev)) {
      newEvents.push({
        tick,
        type: 'SUPPLY',
        title: `${unit.designation} critically low on supply`,
        description: `${unit.faction} ${unit.unitType} supply at ${(supplyLevel * 100).toFixed(0)}%. Nearest supply: ${minDist === Infinity ? 'NONE' : minDist.toFixed(0) + 'km'}`,
        position: unit.position,
        severity: 'WARNING',
      })
    }

    newSupply.set(unit.id, {
      unitId: unit.id,
      supplyLevel,
      lastResupplyTick: minDist <= SUPPLY_RANGE_KM ? tick : (prev?.lastResupplyTick ?? 0),
      distanceToSupply: minDist === Infinity ? -1 : minDist,
    })
  }

  return newSupply
}

// ── Scenario Import/Export ─────────────────────────────────

export interface ScenarioExport {
  version: 1
  name: string
  exportedAt: string
  weather: WeatherCondition
  units: UnitMarker[]
  tick: number
  events: SimulationEvent[]
}

/** Export current simulation state as a portable JSON object */
export function exportScenario(name: string, state: SimulationState): ScenarioExport {
  return {
    version: 1,
    name,
    exportedAt: new Date().toISOString(),
    weather: state.environment.weather,
    units: state.units.map(u => ({ ...u })),
    tick: state.tick,
    events: state.events.filter(e => e.severity === 'CRITICAL' || e.severity === 'FLASH'),
  }
}

/** Import a scenario from JSON, validating structure */
export function importScenario(data: unknown): SimulationState | { error: string } {
  if (!data || typeof data !== 'object') return { error: 'Invalid data' }
  const obj = data as Record<string, unknown>

  if (obj.version !== 1) return { error: 'Unsupported version' }
  if (!Array.isArray(obj.units) || obj.units.length === 0) return { error: 'No units in scenario' }

  const units = obj.units as UnitMarker[]
  // Validate each unit has required fields
  for (const u of units) {
    if (!u.id || !u.designation || !u.faction || !u.position) {
      return { error: `Invalid unit: ${u.id ?? 'unknown'}` }
    }
  }

  const weather = (typeof obj.weather === 'string' ? obj.weather : 'CLEAR') as WeatherCondition
  const state = createInitialState(units, weather)

  if (typeof obj.tick === 'number') {
    return { ...state, tick: obj.tick }
  }

  return state
}

/** Toggle faction AI on/off */
export function setAIEnabled(
  state: SimulationState,
  faction: 'blue' | 'red',
  enabled: boolean,
): SimulationState {
  return {
    ...state,
    aiEnabled: { ...state.aiEnabled, [faction]: enabled },
  }
}

/** After-action report data */
export interface AfterActionReport {
  totalTicks: number
  factions: {
    faction: string
    initialStrength: number
    finalStrength: number
    casualties: number
    unitsDestroyed: number
    unitsRemaining: number
  }[]
  engagementCount: number
  detectionCount: number
  escalationCount: number
  keyEvents: SimulationEvent[]
  winner: string | null
}

/** Generate after-action report from simulation state */
export function generateAfterActionReport(
  initialUnits: UnitMarker[],
  state: SimulationState,
): AfterActionReport {
  const factions = ['BLUE', 'RED', 'GREEN'] as const

  const factionStats = factions.map(faction => {
    const initial = initialUnits.filter(u => u.faction === faction)
    const current = state.units.filter(u => u.faction === faction)
    const initialStr = initial.reduce((s, u) => s + u.strength, 0)
    const finalStr = current.reduce((s, u) => s + u.strength, 0)
    const destroyed = current.filter(u => u.status === 'DESTROYED').length

    return {
      faction,
      initialStrength: initialStr,
      finalStrength: finalStr,
      casualties: initialStr - finalStr,
      unitsDestroyed: destroyed,
      unitsRemaining: current.length - destroyed,
    }
  }).filter(f => f.initialStrength > 0)

  const engagementCount = state.events.filter(e => e.type === 'ENGAGEMENT').length
  const detectionCount = state.events.filter(e => e.type === 'DETECTION').length
  const escalationCount = state.events.filter(e => e.type === 'ESCALATION').length

  // Key events: FLASH severity + first/last engagement + destruction events
  const keyEvents = state.events.filter(e =>
    e.severity === 'FLASH' || e.severity === 'CRITICAL' || e.type === 'CASUALTY'
  ).slice(-20) // last 20 critical events

  // Determine winner by casualty ratio
  const blueStats = factionStats.find(f => f.faction === 'BLUE')
  const redStats = factionStats.find(f => f.faction === 'RED')
  let winner: string | null = null
  if (blueStats && redStats) {
    const blueRatio = blueStats.finalStrength / Math.max(1, blueStats.initialStrength)
    const redRatio = redStats.finalStrength / Math.max(1, redStats.initialStrength)
    if (redStats.unitsRemaining === 0) winner = 'BLUE'
    else if (blueStats.unitsRemaining === 0) winner = 'RED'
    else if (blueRatio > redRatio * 1.5) winner = 'BLUE'
    else if (redRatio > blueRatio * 1.5) winner = 'RED'
  }

  return {
    totalTicks: state.tick,
    factions: factionStats,
    engagementCount,
    detectionCount,
    escalationCount,
    keyEvents,
    winner,
  }
}

/** Check if a unit type is airborne */
function isAirUnit(unitType: string): boolean {
  return unitType.startsWith('AIR_') || unitType === 'UAV'
}

/** Check if a unit type is naval */
function isNavalUnit(unitType: string): boolean {
  return unitType.startsWith('NAVAL_') || unitType === 'CARRIER_GROUP' || unitType === 'AMPHIBIOUS'
}

export function advanceTick(state: SimulationState): SimulationState {
  const tick = state.tick + 1
  const newEvents: SimulationEvent[] = []
  let units = state.units.map(u => ({ ...u }))
  let orders = new Map(state.orders)
  const detections = new Map<string, Set<string>>()
  const engagements = [...state.engagements]
  const env = state.environment
  const weatherMod = WEATHER_MODIFIERS[env.weather]

  // ── Phase 0: Faction AI ────────────────────────────────
  if (state.aiEnabled.red) {
    orders = factionAI('RED', units, orders, state.detections)
  }
  if (state.aiEnabled.blue) {
    orders = factionAI('BLUE', units, orders, state.detections)
  }

  // ── Phase 1: Execute movement orders ──────────────────
  for (const unit of units) {
    if (unit.status === 'DESTROYED') continue

    const order = orders.get(unit.id)
    if (!order) continue

    if (
      order.type === 'MOVE' ||
      order.type === 'ATTACK' ||
      order.type === 'PATROL' ||
      order.type === 'WITHDRAW' ||
      order.type === 'RECON'
    ) {
      let dest = order.destination

      // For ATTACK orders, track the target's current position
      if (order.type === 'ATTACK' && order.targetId) {
        const target = units.find(u => u.id === order.targetId)
        if (target && target.status !== 'DESTROYED') {
          dest = target.position
        }
      }

      const dist = haversineDistance(unit.position, dest)
      let speed = getMaxSpeed(unit.unitType)

      // Apply weather speed modifier
      speed *= weatherMod.speed

      // Apply terrain speed modifier (not for air/naval)
      if (!isAirUnit(unit.unitType) && !isNavalUnit(unit.unitType)) {
        const terrain = env.terrainAtPosition(unit.position)
        speed *= TERRAIN_MODIFIERS[terrain].speedMod
      }

      if (dist <= speed * 0.1) {
        // Arrived
        unit.position = { ...dest }
        unit.speed = 0
        unit.status = 'READY'
        orders.delete(unit.id)

        if (order.type !== 'ATTACK') {
          newEvents.push({
            tick,
            type: 'MOVEMENT',
            title: `${unit.designation} arrived`,
            description: `${unit.designation} reached destination at ${dest.latitude.toFixed(2)}, ${dest.longitude.toFixed(2)}`,
            position: dest,
            severity: 'INFO',
          })
        }
      } else {
        // Move toward destination
        const newPos = moveToward(unit.position, dest, speed)
        unit.heading = bearing(unit.position, dest)
        unit.position = newPos
        unit.speed = speed
        unit.status = 'MOVING'
      }
    } else if (order.type === 'DEFEND') {
      unit.status = 'DEFENDING'
      unit.speed = 0
    }
  }

  // ── Phase 2: Detection ────────────────────────────────
  for (const unit of units) {
    if (unit.status === 'DESTROYED') continue
    const detected = new Set<string>()
    let range = getDetectionRange(unit.unitType)
    // Weather degrades detection
    range *= weatherMod.detection

    for (const other of units) {
      if (other.id === unit.id || other.status === 'DESTROYED') continue
      if (!isHostile(unit, other)) continue

      const dist = haversineDistance(unit.position, other.position)
      if (dist <= range) {
        detected.add(other.id)

        // First detection event
        const prevDetected = state.detections.get(unit.id)
        if (!prevDetected || !prevDetected.has(other.id)) {
          newEvents.push({
            tick,
            type: 'DETECTION',
            title: `${unit.designation} detected ${other.designation}`,
            description: `${unit.faction} forces detected ${other.faction} ${other.unitType} at range ${dist.toFixed(0)}km`,
            position: other.position,
            severity: 'WARNING',
          })
        }
      }
    }

    if (detected.size > 0) {
      detections.set(unit.id, detected)
    }
  }

  // ── Phase 3: Engagement resolution ────────────────────
  const engaged = new Set<string>()

  for (const unit of units) {
    if (unit.status === 'DESTROYED' || engaged.has(unit.id)) continue

    // Only units with ATTACK orders or DEFENDING units in range engage
    const order = orders.get(unit.id)
    const isAttacking = order?.type === 'ATTACK'
    const isDefending = unit.status === 'DEFENDING'

    if (!isAttacking && !isDefending) continue

    for (const other of units) {
      if (other.id === unit.id || other.status === 'DESTROYED') continue
      if (!isHostile(unit, other)) continue
      if (engaged.has(other.id)) continue

      const dist = haversineDistance(unit.position, other.position)
      const engRange = getEngagementRange(unit.unitType)

      if (dist <= engRange) {
        engaged.add(unit.id)
        engaged.add(other.id)

        // Combat resolution with weather and terrain
        let attackerPower = getCombatPower(unit)
        let defenderPower = getCombatPower(other)

        // Weather: reduce air unit combat power in bad weather
        if (isAirUnit(unit.unitType)) attackerPower *= weatherMod.airPower
        if (isAirUnit(other.unitType)) defenderPower *= weatherMod.airPower

        // Terrain modifiers for the defender's position
        const defTerrain = env.terrainAtPosition(other.position)
        const terrainMod = TERRAIN_MODIFIERS[defTerrain]

        // Infantry bonus in favorable terrain
        if (other.unitType === 'INFANTRY' || other.unitType === 'SPECIAL_OPERATIONS') {
          defenderPower *= terrainMod.infantryBonus
        }
        if (unit.unitType === 'INFANTRY' || unit.unitType === 'SPECIAL_OPERATIONS') {
          const atkTerrain = env.terrainAtPosition(unit.position)
          attackerPower *= TERRAIN_MODIFIERS[atkTerrain].infantryBonus
        }

        const ratio = attackerPower / (attackerPower + defenderPower)

        // Posture + terrain defense modifier
        const postureBonus = other.status === 'DEFENDING' ? 1.3 : 1.0
        const defenseBonus = postureBonus * terrainMod.defenseBonus
        const adjustedRatio = attackerPower / (attackerPower + defenderPower * defenseBonus)

        // Apply casualties (percentage of strength)
        const attackerLosses = Math.floor(unit.strength * (1 - adjustedRatio) * 0.05 * (0.8 + Math.random() * 0.4))
        const defenderLosses = Math.floor(other.strength * adjustedRatio * 0.08 * (0.8 + Math.random() * 0.4))

        unit.strength = Math.max(0, unit.strength - attackerLosses)
        unit.readiness = Math.max(0.1, unit.readiness - 0.02)
        other.strength = Math.max(0, other.strength - defenderLosses)
        other.readiness = Math.max(0.1, other.readiness - 0.03)

        unit.status = 'ENGAGED'
        other.status = 'ENGAGED'

        // Check for destruction
        if (unit.strength <= 0) {
          unit.status = 'DESTROYED'
          unit.speed = 0
          orders.delete(unit.id)
        }
        if (other.strength <= 0) {
          other.status = 'DESTROYED'
          other.speed = 0
          orders.delete(other.id)
        }

        const severity = (attackerLosses + defenderLosses > 1000) ? 'CRITICAL' : 'WARNING'

        newEvents.push({
          tick,
          type: 'ENGAGEMENT',
          title: `${unit.designation} engaged ${other.designation}`,
          description: `Combat at ${dist.toFixed(0)}km range. Power ratio: ${(ratio * 100).toFixed(0)}/${((1 - ratio) * 100).toFixed(0)}. ` +
            `Casualties: ${unit.faction} -${attackerLosses.toLocaleString()}, ${other.faction} -${defenderLosses.toLocaleString()}`,
          position: {
            latitude: (unit.position.latitude + other.position.latitude) / 2,
            longitude: (unit.position.longitude + other.position.longitude) / 2,
          },
          severity,
        })

        if (unit.status === 'DESTROYED') {
          newEvents.push({
            tick,
            type: 'CASUALTY',
            title: `${unit.designation} destroyed`,
            description: `${unit.faction} ${unit.unitType} ${unit.designation} has been destroyed in combat`,
            position: unit.position,
            severity: 'FLASH',
          })
        }
        if (other.status === 'DESTROYED') {
          newEvents.push({
            tick,
            type: 'CASUALTY',
            title: `${other.designation} destroyed`,
            description: `${other.faction} ${other.unitType} ${other.designation} has been destroyed in combat`,
            position: other.position,
            severity: 'FLASH',
          })
        }

        break // each unit only engages one target per tick
      }
    }
  }

  // ── Phase 4: Readiness recovery for idle units ────────
  for (const unit of units) {
    if (unit.status === 'DESTROYED') continue
    if (unit.status === 'READY' || unit.status === 'STANDBY' || unit.status === 'DEFENDING') {
      unit.readiness = Math.min(1.0, unit.readiness + 0.005)
    }
    // Supply degradation for moving/engaged units
    if (unit.status === 'MOVING' || unit.status === 'ENGAGED') {
      unit.readiness = Math.max(0.1, unit.readiness - 0.002)
    }
  }

  // ── Phase 4.5: Supply line calculation ─────────────────
  const supply = updateSupplyLines(units, state.supply, tick, newEvents)

  // ── Phase 5: Weather evolution (every 12 ticks / ~12 hours) ─
  let currentWeather = env.weather
  if (tick % 12 === 0 && tick > 0) {
    const weatherOptions: WeatherCondition[] = ['CLEAR', 'OVERCAST', 'RAIN', 'STORM', 'FOG']
    // Weighted random: favor transitions to adjacent conditions
    const idx = weatherOptions.indexOf(currentWeather)
    const weights = weatherOptions.map((_, i) => {
      const diff = Math.abs(i - idx)
      return diff === 0 ? 3 : diff === 1 ? 2 : 1
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let newWeather = currentWeather
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i]
      if (r <= 0) { newWeather = weatherOptions[i]; break }
    }
    if (newWeather !== currentWeather) {
      currentWeather = newWeather
      newEvents.push({
        tick,
        type: 'WEATHER',
        title: `Weather: ${newWeather}`,
        description: `Conditions changed to ${newWeather}. Detection: ${(WEATHER_MODIFIERS[newWeather].detection * 100).toFixed(0)}%, Speed: ${(WEATHER_MODIFIERS[newWeather].speed * 100).toFixed(0)}%, Air Power: ${(WEATHER_MODIFIERS[newWeather].airPower * 100).toFixed(0)}%`,
        severity: newWeather === 'STORM' ? 'WARNING' : 'INFO',
      })
    }
  }

  // ── Phase 6: Tick event ───────────────────────────────
  const aliveBlue = units.filter(u => u.faction === 'BLUE' && u.status !== 'DESTROYED')
  const aliveRed = units.filter(u => u.faction === 'RED' && u.status !== 'DESTROYED')
  const aliveGreen = units.filter(u => u.faction === 'GREEN' && u.status !== 'DESTROYED')

  if (tick % 5 === 0) {
    newEvents.push({
      tick,
      type: 'SIMULATION_TICK',
      title: `SITREP T+${tick}h`,
      description: `BLUE: ${aliveBlue.length} units (${aliveBlue.reduce((s, u) => s + u.strength, 0).toLocaleString()} pers) | ` +
        `RED: ${aliveRed.length} units (${aliveRed.reduce((s, u) => s + u.strength, 0).toLocaleString()} pers) | ` +
        `GREEN: ${aliveGreen.length} units (${aliveGreen.reduce((s, u) => s + u.strength, 0).toLocaleString()} pers) | ` +
        `WX: ${currentWeather}`,
      severity: 'INFO',
    })
  }

  return {
    ...state,
    tick,
    units,
    orders,
    events: [...state.events, ...newEvents],
    detections,
    engagements,
    supply,
    environment: { ...env, weather: currentWeather },
    isRunning: state.isRunning,
  }
}
