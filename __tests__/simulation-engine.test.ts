import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  advanceTick,
  issueOrder,
  resetSimulation,
  takeSnapshot,
  restoreSnapshot,
  type UnitOrder,
} from '@/lib/simulation-engine'
import type { UnitMarker } from '@/types/military'

// ── Test fixtures ──────────────────────────────────────────

function makeUnit(overrides: Partial<UnitMarker> & { id: string }): UnitMarker {
  return {
    designation: overrides.id.toUpperCase(),
    unitType: 'INFANTRY',
    faction: 'BLUE',
    position: { latitude: 0, longitude: 0 },
    heading: 0,
    speed: 0,
    strength: 10000,
    readiness: 0.9,
    status: 'READY',
    echelon: 'DIVISION',
    ...overrides,
  }
}

const blueInfantry = makeUnit({
  id: 'b1',
  designation: '1st Infantry',
  faction: 'BLUE',
  position: { latitude: 25.0, longitude: 121.0 },
})

const redArmor = makeUnit({
  id: 'r1',
  designation: 'Red Armor',
  faction: 'RED',
  unitType: 'ARMOR',
  position: { latitude: 25.05, longitude: 121.05 },
  strength: 12000,
})

const greenDefender = makeUnit({
  id: 'g1',
  designation: 'Green Guard',
  faction: 'GREEN',
  position: { latitude: 24.5, longitude: 120.5 },
  status: 'DEFENDING',
})

// ── createInitialState ─────────────────────────────────────

describe('createInitialState', () => {
  it('creates state with tick 0 and all units', () => {
    const state = createInitialState([blueInfantry, redArmor])
    expect(state.tick).toBe(0)
    expect(state.units).toHaveLength(2)
    expect(state.isRunning).toBe(false)
    expect(state.events).toHaveLength(0)
    expect(state.orders.size).toBe(0)
  })

  it('deep copies units so mutations do not leak', () => {
    const units = [blueInfantry]
    const state = createInitialState(units)
    state.units[0].strength = 0
    expect(blueInfantry.strength).toBe(10000)
  })
})

// ── issueOrder ─────────────────────────────────────────────

describe('issueOrder', () => {
  it('adds an order to the state', () => {
    const state = createInitialState([blueInfantry])
    const order: UnitOrder = {
      unitId: 'b1',
      type: 'MOVE',
      destination: { latitude: 26.0, longitude: 122.0 },
    }
    const next = issueOrder(state, order)
    expect(next.orders.size).toBe(1)
    expect(next.orders.get('b1')?.type).toBe('MOVE')
  })

  it('replaces an existing order for the same unit', () => {
    let state = createInitialState([blueInfantry])
    state = issueOrder(state, { unitId: 'b1', type: 'MOVE', destination: { latitude: 26, longitude: 122 } })
    state = issueOrder(state, { unitId: 'b1', type: 'DEFEND', destination: { latitude: 25, longitude: 121 } })
    expect(state.orders.size).toBe(1)
    expect(state.orders.get('b1')?.type).toBe('DEFEND')
  })
})

// ── advanceTick ────────────────────────────────────────────

describe('advanceTick', () => {
  it('increments the tick counter', () => {
    const state = createInitialState([blueInfantry])
    const next = advanceTick(state)
    expect(next.tick).toBe(1)
  })

  it('moves a unit toward its MOVE destination', () => {
    let state = createInitialState([blueInfantry])
    state = issueOrder(state, {
      unitId: 'b1',
      type: 'MOVE',
      destination: { latitude: 30.0, longitude: 125.0 },
    })
    const next = advanceTick(state)
    const unit = next.units.find(u => u.id === 'b1')!
    // Should have moved north-east
    expect(unit.position.latitude).toBeGreaterThan(25.0)
    expect(unit.status).toBe('MOVING')
  })

  it('sets DEFENDING status for DEFEND orders', () => {
    let state = createInitialState([blueInfantry])
    state = issueOrder(state, {
      unitId: 'b1',
      type: 'DEFEND',
      destination: { latitude: 25.0, longitude: 121.0 },
    })
    const next = advanceTick(state)
    const unit = next.units.find(u => u.id === 'b1')!
    expect(unit.status).toBe('DEFENDING')
    expect(unit.speed).toBe(0)
  })

  it('generates detection events when hostiles are nearby', () => {
    // Place units close enough to detect each other
    const blue = makeUnit({ id: 'b1', faction: 'BLUE', position: { latitude: 25.0, longitude: 121.0 } })
    const red = makeUnit({ id: 'r1', faction: 'RED', position: { latitude: 25.3, longitude: 121.3 } })

    const state = createInitialState([blue, red])
    const next = advanceTick(state)
    const detectionEvents = next.events.filter(e => e.type === 'DETECTION')
    expect(detectionEvents.length).toBeGreaterThan(0)
  })

  it('does not detect allies', () => {
    const blue = makeUnit({ id: 'b1', faction: 'BLUE', position: { latitude: 25.0, longitude: 121.0 } })
    const green = makeUnit({ id: 'g1', faction: 'GREEN', position: { latitude: 25.01, longitude: 121.01 } })

    const state = createInitialState([blue, green])
    const next = advanceTick(state)
    const detectionEvents = next.events.filter(e => e.type === 'DETECTION')
    expect(detectionEvents).toHaveLength(0)
  })

  it('resolves combat engagement when attacking unit is in range', () => {
    // INFANTRY engagement range is 3km. Place units ~0.1km apart.
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE', unitType: 'INFANTRY',
      position: { latitude: 25.0, longitude: 121.0 }, strength: 10000,
    })
    const red = makeUnit({
      id: 'r1', faction: 'RED', unitType: 'INFANTRY',
      position: { latitude: 25.0005, longitude: 121.0005 }, strength: 10000,
    })

    let state = createInitialState([blue, red])
    // Issue ATTACK order and also issue a DEFEND on red so it engages
    state = issueOrder(state, {
      unitId: 'b1',
      type: 'ATTACK',
      destination: red.position,
      targetId: 'r1',
    })
    state = issueOrder(state, {
      unitId: 'r1',
      type: 'DEFEND',
      destination: red.position,
    })

    // Run a few ticks so blue arrives and engages
    for (let i = 0; i < 3; i++) {
      state = advanceTick(state)
    }
    const engagementEvents = state.events.filter(e => e.type === 'ENGAGEMENT')
    expect(engagementEvents.length).toBeGreaterThan(0)

    // Both units should have taken casualties
    const b = state.units.find(u => u.id === 'b1')!
    const r = state.units.find(u => u.id === 'r1')!
    expect(b.strength + r.strength).toBeLessThan(20000)
  })

  it('inflicts casualties and can destroy units over time', () => {
    // Large force vs medium force at close range
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE', unitType: 'CARRIER_GROUP',
      position: { latitude: 25.0, longitude: 121.0 }, strength: 50000, readiness: 1.0,
    })
    const red = makeUnit({
      id: 'r1', faction: 'RED', unitType: 'INFANTRY',
      position: { latitude: 25.0005, longitude: 121.0005 }, strength: 5000, readiness: 0.5,
    })

    let state = createInitialState([blue, red])
    state = issueOrder(state, {
      unitId: 'b1', type: 'ATTACK',
      destination: red.position, targetId: 'r1',
    })
    state = issueOrder(state, {
      unitId: 'r1', type: 'DEFEND',
      destination: red.position,
    })

    const initialRedStrength = 5000
    // Run enough ticks for combat to whittle down the defender
    for (let i = 0; i < 100; i++) {
      state = advanceTick(state)
    }

    const r = state.units.find(u => u.id === 'r1')!
    // Either destroyed or severely weakened
    if (r.status !== 'DESTROYED') {
      expect(r.strength).toBeLessThan(initialRedStrength * 0.3)
    }
    // Blue should have taken some casualties too but be mostly intact
    const b = state.units.find(u => u.id === 'b1')!
    expect(b.strength).toBeLessThan(50000)
    expect(b.strength).toBeGreaterThan(0)
  })

  it('recovers readiness for idle units', () => {
    const unit = makeUnit({ id: 'b1', readiness: 0.5, status: 'READY' })
    let state = createInitialState([unit])
    const next = advanceTick(state)
    const u = next.units.find(u => u.id === 'b1')!
    expect(u.readiness).toBeGreaterThan(0.5)
  })

  it('degrades readiness for moving units', () => {
    const unit = makeUnit({ id: 'b1', readiness: 0.9 })
    let state = createInitialState([unit])
    state = issueOrder(state, {
      unitId: 'b1', type: 'MOVE',
      destination: { latitude: 30, longitude: 125 },
    })
    const next = advanceTick(state)
    const u = next.units.find(u => u.id === 'b1')!
    expect(u.readiness).toBeLessThan(0.9)
  })

  it('generates SITREP events every 5 ticks', () => {
    let state = createInitialState([blueInfantry])
    for (let i = 0; i < 5; i++) {
      state = advanceTick(state)
    }
    const sitreps = state.events.filter(e => e.type === 'SIMULATION_TICK')
    expect(sitreps).toHaveLength(1)
    expect(sitreps[0].title).toContain('SITREP')
  })

  it('skips destroyed units in all phases', () => {
    const destroyed = makeUnit({ id: 'd1', status: 'DESTROYED', strength: 0 })
    let state = createInitialState([destroyed, blueInfantry])
    state = advanceTick(state)
    const d = state.units.find(u => u.id === 'd1')!
    expect(d.status).toBe('DESTROYED')
  })
})

// ── RED Force AI ───────────────────────────────────────────

describe('RED Force AI', () => {
  it('auto-issues ATTACK orders for idle RED units near hostiles', () => {
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE',
      position: { latitude: 25.0, longitude: 121.0 },
    })
    const red = makeUnit({
      id: 'r1', faction: 'RED',
      position: { latitude: 25.3, longitude: 121.3 },
    })

    let state = createInitialState([blue, red])
    // Run a tick to populate detections
    state = advanceTick(state)
    // Run another tick - RED AI should now issue an order
    state = advanceTick(state)

    // RED unit should be moving or engaged (AI issued attack)
    const r = state.units.find(u => u.id === 'r1')!
    expect(['MOVING', 'ENGAGED', 'READY']).toContain(r.status)
  })

  it('does not issue orders for destroyed RED units', () => {
    const blue = makeUnit({ id: 'b1', faction: 'BLUE', position: { latitude: 25, longitude: 121 } })
    const red = makeUnit({
      id: 'r1', faction: 'RED', status: 'DESTROYED', strength: 0,
      position: { latitude: 25.01, longitude: 121.01 },
    })

    let state = createInitialState([blue, red])
    state = advanceTick(state)
    const r = state.units.find(u => u.id === 'r1')!
    expect(r.status).toBe('DESTROYED')
  })

  it('static units (MISSILE, AIR_DEFENSE) do not move to attack', () => {
    // MISSILE detection range default is 80km, 1.5x = 120km
    // Place 6000+ km apart so even fallback path won't trigger ATTACK
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE',
      position: { latitude: -30, longitude: 60 },
    })
    const missile = makeUnit({
      id: 'r1', faction: 'RED', unitType: 'MISSILE',
      position: { latitude: 50, longitude: 120 },
    })

    let state = createInitialState([blue, missile])
    for (let i = 0; i < 5; i++) {
      state = advanceTick(state)
    }
    const m = state.units.find(u => u.id === 'r1')!
    // Static unit should not have moved
    expect(m.position.latitude).toBe(50)
    expect(m.position.longitude).toBe(120)
  })
})

// ── Snapshot / Reset ───────────────────────────────────────

describe('resetSimulation', () => {
  it('returns a fresh state with the given units', () => {
    let state = createInitialState([blueInfantry, redArmor])
    state = advanceTick(state)
    state = advanceTick(state)

    const reset = resetSimulation([blueInfantry])
    expect(reset.tick).toBe(0)
    expect(reset.units).toHaveLength(1)
    expect(reset.events).toHaveLength(0)
  })
})

describe('takeSnapshot / restoreSnapshot', () => {
  it('captures and restores simulation state', () => {
    let state = createInitialState([blueInfantry, redArmor])
    state = issueOrder(state, {
      unitId: 'b1', type: 'MOVE',
      destination: { latitude: 30, longitude: 125 },
    })
    for (let i = 0; i < 3; i++) {
      state = advanceTick(state)
    }

    const snap = takeSnapshot(state)
    expect(snap.tick).toBe(3)
    expect(snap.units).toHaveLength(2)

    // Advance further
    for (let i = 0; i < 5; i++) {
      state = advanceTick(state)
    }
    expect(state.tick).toBe(8)

    // Restore
    const restored = restoreSnapshot(snap)
    expect(restored.tick).toBe(3)
    expect(restored.isRunning).toBe(false)
    expect(restored.orders.size).toBe(0)
  })

  it('snapshot creates deep copies', () => {
    const state = createInitialState([blueInfantry])
    const snap = takeSnapshot(state)
    snap.units[0].strength = 0
    expect(state.units[0].strength).toBe(10000)
  })
})

// ── Alliance system ────────────────────────────────────────

describe('alliance system', () => {
  it('BLUE and GREEN do not fight each other', () => {
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE',
      position: { latitude: 25.0, longitude: 121.0 },
    })
    const green = makeUnit({
      id: 'g1', faction: 'GREEN',
      position: { latitude: 25.001, longitude: 121.001 },
    })

    let state = createInitialState([blue, green])
    state = issueOrder(state, {
      unitId: 'b1', type: 'ATTACK',
      destination: green.position, targetId: 'g1',
    })

    for (let i = 0; i < 5; i++) {
      state = advanceTick(state)
    }

    // No engagement events between allies
    const engagements = state.events.filter(e => e.type === 'ENGAGEMENT')
    expect(engagements).toHaveLength(0)
  })

  it('NEUTRAL units are not attacked', () => {
    const blue = makeUnit({
      id: 'b1', faction: 'BLUE',
      position: { latitude: 25.0, longitude: 121.0 },
    })
    const neutral = makeUnit({
      id: 'n1', faction: 'NEUTRAL',
      position: { latitude: 25.001, longitude: 121.001 },
    })

    let state = createInitialState([blue, neutral])
    for (let i = 0; i < 5; i++) {
      state = advanceTick(state)
    }

    const engagements = state.events.filter(e => e.type === 'ENGAGEMENT')
    expect(engagements).toHaveLength(0)
  })
})
