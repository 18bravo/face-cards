/**
 * MiroFish Integration Layer
 *
 * Interfaces with MiroFish swarm intelligence engine to run
 * multi-agent military campaign simulations.
 *
 * MiroFish architecture:
 * - Python backend running OASIS (Open Agent Social Interaction Simulations)
 * - GraphRAG for knowledge graph construction
 * - Zep/OpenViking for agent memory
 * - Supports up to 1M agents
 *
 * This module provides the API client for launching simulations,
 * monitoring progress, and retrieving results.
 */

import type { SimulationConfig, SimulationResult, SimulationEvent } from '@/types/military'

const MIROFISH_API_URL = process.env.MIROFISH_API_URL || 'http://localhost:8000'
const MIROFISH_API_KEY = process.env.MIROFISH_API_KEY || ''

interface MiroFishWorldConfig {
  seed_topic: string
  agent_count: number
  model: string
  platforms: string[]
  knowledge_sources: KnowledgeSource[]
  simulation_rounds: number
  environment: EnvironmentConfig
}

interface KnowledgeSource {
  type: 'text' | 'url' | 'document' | 'knowledge_graph'
  content: string
  metadata?: Record<string, unknown>
}

interface EnvironmentConfig {
  terrain_effects: boolean
  weather_system: boolean
  logistics_modeling: boolean
  cyber_domain: boolean
  information_operations: boolean
}

interface MiroFishStatus {
  simulation_id: string
  status: 'initializing' | 'building_world' | 'spawning_agents' | 'running' | 'analyzing' | 'completed' | 'failed'
  progress: number // 0-100
  current_round: number
  total_rounds: number
  agent_count: number
  active_interactions: number
}

interface MiroFishReport {
  simulation_id: string
  summary: string
  predictions: Array<{
    label: string
    probability: number
    description: string
    timeframe: string
  }>
  key_events: Array<{
    round: number
    type: string
    description: string
    agents_involved: number
    impact_score: number
  }>
  faction_analysis: Record<string, {
    morale: number
    cohesion: number
    effectiveness: number
    losses: number
    territory_control: number
  }>
  escalation_risk: number // 0-1
  narrative_arcs: string[]
}

/**
 * Build the MiroFish world configuration from an EnderAI scenario
 */
export function buildWorldConfig(
  scenarioDescription: string,
  config: SimulationConfig,
  unitData: string
): MiroFishWorldConfig {
  const seedTopic = `MILITARY CAMPAIGN SIMULATION

SCENARIO: ${scenarioDescription}

FORCES AND DISPOSITION:
${unitData}

SIMULATION PARAMETERS:
- Factions: ${config.factions.join(', ')}
- Agent count per faction: ${Math.floor(config.agentCount / config.factions.length)}
- Agents represent: commanders, intelligence analysts, logistics officers, field operators, diplomats, civilian leaders
- Each agent has: rank, role, faction loyalty, risk tolerance, information access level
- Agents interact across two platforms: a military command net (formal orders/reports) and an informal channel (rumors, morale, back-channel communications)

RULES OF ENGAGEMENT:
- Agents must consider terrain, weather, supply lines, and force ratios
- Escalation decisions require chain-of-command approval modeling
- Intelligence is imperfect — fog of war applies
- Cyber operations can disrupt communications and logistics
- Agent decisions should reflect realistic military doctrine

OUTPUT: Track engagements, territorial changes, casualty estimates, escalation events, and predict campaign outcomes.`

  return {
    seed_topic: seedTopic,
    agent_count: config.agentCount,
    model: config.model,
    platforms: ['military_command_net', 'informal_channel'],
    knowledge_sources: [
      {
        type: 'text',
        content: unitData,
        metadata: { source: 'enderai_scenario', classification: 'UNCLASSIFIED' },
      },
    ],
    simulation_rounds: Math.ceil(config.agentCount / 10),
    environment: {
      terrain_effects: config.environmentFactors.terrain,
      weather_system: config.environmentFactors.weather,
      logistics_modeling: config.environmentFactors.logistics,
      cyber_domain: config.environmentFactors.cyberDomain,
      information_operations: true,
    },
  }
}

/**
 * Launch a new MiroFish simulation
 */
export async function launchSimulation(worldConfig: MiroFishWorldConfig): Promise<string> {
  const response = await fetch(`${MIROFISH_API_URL}/api/v1/simulations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MIROFISH_API_KEY}`,
    },
    body: JSON.stringify(worldConfig),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`MiroFish simulation launch failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.simulation_id
}

/**
 * Check simulation status
 */
export async function getSimulationStatus(simulationId: string): Promise<MiroFishStatus> {
  const response = await fetch(`${MIROFISH_API_URL}/api/v1/simulations/${simulationId}/status`, {
    headers: {
      'Authorization': `Bearer ${MIROFISH_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`MiroFish status check failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Retrieve simulation report
 */
export async function getSimulationReport(simulationId: string): Promise<MiroFishReport> {
  const response = await fetch(`${MIROFISH_API_URL}/api/v1/simulations/${simulationId}/report`, {
    headers: {
      'Authorization': `Bearer ${MIROFISH_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`MiroFish report retrieval failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Inject a variable into a running simulation (God's-eye intervention)
 */
export async function injectVariable(
  simulationId: string,
  variable: {
    type: 'event' | 'reinforcement' | 'weather' | 'intelligence' | 'cyber_attack' | 'escalation'
    description: string
    affectedFactions: string[]
    magnitude: number // 0-1
  }
): Promise<void> {
  const response = await fetch(`${MIROFISH_API_URL}/api/v1/simulations/${simulationId}/inject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MIROFISH_API_KEY}`,
    },
    body: JSON.stringify(variable),
  })

  if (!response.ok) {
    throw new Error(`MiroFish variable injection failed: ${response.status}`)
  }
}

/**
 * Stream simulation events in real-time via SSE
 */
export function streamSimulationEvents(
  simulationId: string,
  onEvent: (event: SimulationEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(
    `${MIROFISH_API_URL}/api/v1/simulations/${simulationId}/stream?token=${MIROFISH_API_KEY}`
  )

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onEvent({
        tick: data.round,
        type: data.type,
        title: data.title,
        description: data.description,
        position: data.location ? {
          latitude: data.location.lat,
          longitude: data.location.lon,
        } : undefined,
        severity: mapSeverity(data.impact_score),
      })
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  eventSource.onerror = () => {
    onError?.(new Error('MiroFish event stream disconnected'))
  }

  return () => eventSource.close()
}

/**
 * Convert MiroFish report to EnderAI SimulationResult
 */
export function convertReport(simulationId: string, report: MiroFishReport): SimulationResult {
  return {
    id: simulationId,
    status: 'COMPLETED',
    agentCount: 0, // filled by caller
    summary: report.summary,
    events: report.key_events.map((e, i) => ({
      tick: e.round,
      type: e.type,
      title: `Round ${e.round}: ${e.type}`,
      description: e.description,
      severity: mapSeverity(e.impact_score),
    })),
    predictions: report.predictions.map(p => ({
      label: p.label,
      probability: p.probability,
      description: p.description,
      timeframe: p.timeframe,
    })),
  }
}

function mapSeverity(impactScore: number): 'INFO' | 'WARNING' | 'CRITICAL' | 'FLASH' {
  if (impactScore >= 0.9) return 'FLASH'
  if (impactScore >= 0.7) return 'CRITICAL'
  if (impactScore >= 0.4) return 'WARNING'
  return 'INFO'
}
