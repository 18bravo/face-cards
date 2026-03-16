import { describe, it, expect } from 'vitest'
import { FACTION_COLORS, UNIT_TYPE_ICONS, THEATERS } from '@/types/military'
import type { UnitMarker, SimulationEvent, Position, SimulationConfig } from '@/types/military'

// ── Type smoke tests ───────────────────────────────────────
// Verify all exports, constants, and type shapes are correct

describe('military types smoke tests', () => {
  it('FACTION_COLORS has all four factions', () => {
    expect(FACTION_COLORS.BLUE).toBe('#3b82f6')
    expect(FACTION_COLORS.RED).toBe('#ef4444')
    expect(FACTION_COLORS.GREEN).toBe('#22c55e')
    expect(FACTION_COLORS.NEUTRAL).toBe('#f59e0b')
  })

  it('UNIT_TYPE_ICONS covers all major unit types', () => {
    const expected = [
      'INFANTRY', 'ARMOR', 'ARTILLERY', 'AIR_DEFENSE',
      'NAVAL_SURFACE', 'NAVAL_SUBSURFACE', 'CARRIER_GROUP',
      'SPECIAL_OPERATIONS', 'CYBER', 'MISSILE', 'AIR_FIGHTER',
      'AIR_BOMBER', 'UAV', 'LOGISTICS', 'COMMAND',
    ]
    for (const type of expected) {
      expect(UNIT_TYPE_ICONS[type]).toBeDefined()
    }
  })

  it('THEATERS has all 7 COCOM regions', () => {
    const expected = ['INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM', 'GLOBAL']
    for (const t of expected) {
      expect(THEATERS[t]).toBeDefined()
      expect(THEATERS[t].center.latitude).toBeTypeOf('number')
      expect(THEATERS[t].center.longitude).toBeTypeOf('number')
      expect(THEATERS[t].zoomLevel).toBeGreaterThan(0)
    }
  })

  it('THEATERS bounds are valid geographic ranges', () => {
    for (const [key, theater] of Object.entries(THEATERS)) {
      expect(theater.bounds.north).toBeGreaterThanOrEqual(theater.bounds.south)
      expect(theater.center.latitude).toBeGreaterThanOrEqual(-90)
      expect(theater.center.latitude).toBeLessThanOrEqual(90)
      expect(theater.center.longitude).toBeGreaterThanOrEqual(-180)
      expect(theater.center.longitude).toBeLessThanOrEqual(180)
    }
  })

  it('UnitMarker shape is correct', () => {
    const unit: UnitMarker = {
      id: 'test-1',
      designation: 'Test Unit',
      unitType: 'INFANTRY',
      faction: 'BLUE',
      position: { latitude: 25, longitude: 121 },
      heading: 90,
      speed: 0,
      strength: 10000,
      readiness: 0.95,
      status: 'READY',
      echelon: 'DIVISION',
    }
    expect(unit.id).toBe('test-1')
    expect(unit.faction).toBe('BLUE')
  })

  it('SimulationEvent shape is correct', () => {
    const event: SimulationEvent = {
      tick: 5,
      type: 'ENGAGEMENT',
      title: 'Test engagement',
      description: 'Two units fighting',
      severity: 'WARNING',
      position: { latitude: 25, longitude: 121 },
    }
    expect(event.tick).toBe(5)
    expect(['INFO', 'WARNING', 'CRITICAL', 'FLASH']).toContain(event.severity)
  })

  it('Position can have optional altitude', () => {
    const pos: Position = { latitude: 25, longitude: 121 }
    expect(pos.altitude).toBeUndefined()

    const posWithAlt: Position = { latitude: 25, longitude: 121, altitude: 10000 }
    expect(posWithAlt.altitude).toBe(10000)
  })

  it('SimulationConfig shape is correct', () => {
    const config: SimulationConfig = {
      agentCount: 50,
      model: 'gpt-4o',
      seedPrompt: 'Test scenario',
      tickInterval: 1000,
      factions: ['BLUE', 'RED'],
      environmentFactors: {
        weather: true,
        terrain: true,
        logistics: true,
        cyberDomain: false,
      },
    }
    expect(config.agentCount).toBe(50)
    expect(config.factions).toHaveLength(2)
  })
})

// ── Simulation engine exports smoke test ───────────────────

describe('simulation-engine exports smoke test', () => {
  it('all exports are importable', async () => {
    const engine = await import('@/lib/simulation-engine')
    expect(engine.createInitialState).toBeTypeOf('function')
    expect(engine.advanceTick).toBeTypeOf('function')
    expect(engine.issueOrder).toBeTypeOf('function')
    expect(engine.resetSimulation).toBeTypeOf('function')
    expect(engine.takeSnapshot).toBeTypeOf('function')
    expect(engine.restoreSnapshot).toBeTypeOf('function')
    expect(engine.setAIEnabled).toBeTypeOf('function')
    expect(engine.generateAfterActionReport).toBeTypeOf('function')
  })
})

// ── MiroFish client smoke test ─────────────────────────────

describe('mirofish exports smoke test', () => {
  it('all exports are importable', async () => {
    const mirofish = await import('@/lib/mirofish')
    expect(mirofish.buildWorldConfig).toBeTypeOf('function')
    expect(mirofish.launchSimulation).toBeTypeOf('function')
    expect(mirofish.getSimulationStatus).toBeTypeOf('function')
    expect(mirofish.getSimulationReport).toBeTypeOf('function')
    expect(mirofish.injectVariable).toBeTypeOf('function')
    expect(mirofish.streamSimulationEvents).toBeTypeOf('function')
    expect(mirofish.convertReport).toBeTypeOf('function')
  })
})

// ── Feed ingestion smoke test ──────────────────────────────
// feeds and audit modules import Prisma, which requires a database adapter.
// These are skipped in CI/test environments without a database.

describe('feeds exports smoke test', () => {
  it.skip('all exports are importable (requires database)', async () => {
    const feeds = await import('@/lib/feeds')
    expect(feeds.fetchFeed).toBeTypeOf('function')
    expect(feeds.ingestAllFeeds).toBeTypeOf('function')
    expect(feeds.DEFAULT_FEEDS).toBeDefined()
    expect(Array.isArray(feeds.DEFAULT_FEEDS)).toBe(true)
    expect(feeds.DEFAULT_FEEDS.length).toBeGreaterThan(0)
  })
})

// ── Audit log smoke test ───────────────────────────────────

describe('audit exports smoke test', () => {
  it.skip('all exports are importable (requires database)', async () => {
    const audit = await import('@/lib/audit')
    expect(audit.audit).toBeTypeOf('function')
    expect(audit.queryAuditLogs).toBeTypeOf('function')
  })
})
