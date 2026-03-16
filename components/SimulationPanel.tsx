'use client'

import { useState } from 'react'
import type { UnitMarker, SimulationEvent } from '@/types/military'
import { FACTION_COLORS } from '@/types/military'
import Timeline from './Timeline'
import UnitPlacement from './UnitPlacement'
import UnitHierarchy from './UnitHierarchy'

interface SimulationPanelProps {
  scenarioId?: string
  units: UnitMarker[]
  events: SimulationEvent[]
  isRunning: boolean
  currentTick: number
  onStartSimulation: () => void
  onPauseSimulation: () => void
  onInjectEvent: (event: { type: string; description: string; magnitude: number }) => void
  onPlaceUnit?: (unit: Omit<UnitMarker, 'id'>) => void
  onUnitSelect?: (unit: UnitMarker) => void
  pendingPlacement?: { latitude: number; longitude: number } | null
  placementMode?: boolean
  onTogglePlacement?: () => void
  onSeekTick?: (tick: number) => void
}

export default function SimulationPanel({
  units,
  events,
  isRunning,
  currentTick,
  onStartSimulation,
  onPauseSimulation,
  onInjectEvent,
  onPlaceUnit,
  onUnitSelect,
  pendingPlacement,
  placementMode,
  onTogglePlacement,
  onSeekTick,
}: SimulationPanelProps) {
  const [activeTab, setActiveTab] = useState<'orbat' | 'tree' | 'timeline' | 'deploy' | 'inject' | 'mirofish'>('orbat')
  const [injectType, setInjectType] = useState('event')
  const [injectDesc, setInjectDesc] = useState('')
  const [injectMagnitude, setInjectMagnitude] = useState(0.5)
  const [orbatFilter, setOrbatFilter] = useState<string | null>(null)

  const alive = units.filter(u => u.status !== 'DESTROYED')
  const blueAlive = alive.filter(u => u.faction === 'BLUE')
  const redAlive = alive.filter(u => u.faction === 'RED')
  const greenAlive = alive.filter(u => u.faction === 'GREEN')
  const destroyed = units.filter(u => u.status === 'DESTROYED')

  const blueStr = blueAlive.reduce((s, u) => s + u.strength, 0)
  const redStr = redAlive.reduce((s, u) => s + u.strength, 0)
  const greenStr = greenAlive.reduce((s, u) => s + u.strength, 0)

  const filteredUnits = orbatFilter
    ? alive.filter(u => u.faction === orbatFilter)
    : alive

  const tabs = [
    { id: 'orbat' as const, label: 'ORBAT' },
    { id: 'tree' as const, label: 'TREE' },
    { id: 'timeline' as const, label: 'TIMELINE' },
    { id: 'deploy' as const, label: 'DEPLOY' },
    { id: 'inject' as const, label: 'INJECT' },
    { id: 'mirofish' as const, label: 'FISH' },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-950/95 border-l border-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="hud-label">Simulation Control</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="font-mono text-xs text-gray-400">T+{currentTick}h</span>
          </div>
        </div>

        {/* Force summary with strength */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: 'BLUE', units: blueAlive, str: blueStr, color: FACTION_COLORS.BLUE },
            { label: 'RED', units: redAlive, str: redStr, color: FACTION_COLORS.RED },
            { label: 'GREEN', units: greenAlive, str: greenStr, color: FACTION_COLORS.GREEN },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setOrbatFilter(orbatFilter === f.label ? null : f.label)}
              className={`hud-panel p-2 text-center transition-colors ${orbatFilter === f.label ? 'border-current' : ''}`}
              style={{ borderColor: orbatFilter === f.label ? f.color : undefined }}
            >
              <div className="font-mono font-bold" style={{ color: f.color }}>{f.units.length}</div>
              <div className="text-gray-500 text-[10px]">{f.label}</div>
              <div className="text-gray-600 text-[9px] font-mono">{(f.str / 1000).toFixed(0)}K</div>
            </button>
          ))}
        </div>

        {/* Play controls */}
        <div className="flex gap-2 mt-3">
          {!isRunning ? (
            <button
              onClick={onStartSimulation}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded transition-colors"
            >
              ▶ START
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono rounded transition-colors"
            >
              ⏸ PAUSE
            </button>
          )}
          {destroyed.length > 0 && (
            <div className="flex items-center px-2 text-[10px] font-mono text-gray-600">
              {destroyed.length} KIA
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[10px] font-mono transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* ── ORBAT ────────────────────────────────────────── */}
        {activeTab === 'orbat' && (
          <>
            {filteredUnits.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-8">
                {units.length === 0 ? 'No units deployed. Use DEPLOY tab.' : 'No matching units.'}
              </div>
            ) : (
              filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => onUnitSelect?.(unit)}
                  className="hud-panel p-2 cursor-pointer hover:border-cyan-400/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: FACTION_COLORS[unit.faction] || '#fff' }}
                      >
                        {unit.designation}
                      </span>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {unit.unitType.replace(/_/g, ' ')} · {unit.echelon.replace(/_/g, ' ')} · {unit.strength.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-mono ${
                        unit.status === 'ENGAGED' ? 'text-red-400' :
                        unit.status === 'MOVING' ? 'text-amber-400' :
                        unit.status === 'DEFENDING' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {unit.status}
                      </div>
                      <div className="w-16 h-1 bg-gray-800 rounded mt-1 overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${unit.readiness * 100}%`,
                            backgroundColor: unit.readiness > 0.7 ? '#22c55e' : unit.readiness > 0.4 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── HIERARCHY TREE ──────────────────────────────── */}
        {activeTab === 'tree' && (
          <UnitHierarchy units={units} onUnitSelect={(u) => onUnitSelect?.(u)} />
        )}

        {/* ── TIMELINE ─────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <Timeline
            events={events}
            currentTick={currentTick}
            maxTick={currentTick}
            onSeekTick={onSeekTick || (() => {})}
            isRunning={isRunning}
          />
        )}

        {/* ── DEPLOY ───────────────────────────────────────── */}
        {activeTab === 'deploy' && (
          <>
            {placementMode ? (
              <UnitPlacement
                onPlace={(unit) => onPlaceUnit?.(unit)}
                onCancel={() => onTogglePlacement?.()}
                pendingPosition={pendingPlacement || null}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Deploy new military units onto the battlefield.
                </p>
                <button
                  onClick={() => onTogglePlacement?.()}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded transition-colors"
                >
                  + DEPLOY NEW UNIT
                </button>
                <div className="hud-label mt-4">Current Forces</div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-blue-400">
                    <span>BLUE</span>
                    <span>{blueAlive.length} units / {(blueStr / 1000).toFixed(0)}K pers</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>RED</span>
                    <span>{redAlive.length} units / {(redStr / 1000).toFixed(0)}K pers</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>GREEN</span>
                    <span>{greenAlive.length} units / {(greenStr / 1000).toFixed(0)}K pers</span>
                  </div>
                  {destroyed.length > 0 && (
                    <div className="flex justify-between text-gray-600 mt-2">
                      <span>DESTROYED</span>
                      <span>{destroyed.length} units</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── INJECT ───────────────────────────────────────── */}
        {activeTab === 'inject' && (
          <div className="space-y-3">
            <div className="hud-label">God&apos;s Eye Intervention</div>
            <p className="text-xs text-gray-500">
              Inject a variable into the running simulation to alter conditions.
            </p>

            <div>
              <label className="hud-label">Event Type</label>
              <select
                value={injectType}
                onChange={e => setInjectType(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300"
              >
                <option value="event">General Event</option>
                <option value="reinforcement">Reinforcement</option>
                <option value="weather">Weather Change</option>
                <option value="intelligence">Intelligence Report</option>
                <option value="cyber_attack">Cyber Attack</option>
                <option value="escalation">Escalation</option>
              </select>
            </div>

            <div>
              <label className="hud-label">Description</label>
              <textarea
                value={injectDesc}
                onChange={e => setInjectDesc(e.target.value)}
                rows={3}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300 resize-none"
                placeholder="Describe the event to inject..."
              />
            </div>

            <div>
              <label className="hud-label">Magnitude: {(injectMagnitude * 100).toFixed(0)}%</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={injectMagnitude}
                onChange={e => setInjectMagnitude(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <button
              onClick={() => {
                if (injectDesc.trim()) {
                  onInjectEvent({ type: injectType, description: injectDesc, magnitude: injectMagnitude })
                  setInjectDesc('')
                }
              }}
              disabled={!isRunning || !injectDesc.trim()}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-mono rounded transition-colors"
            >
              INJECT VARIABLE
            </button>
          </div>
        )}

        {/* ── MIROFISH ─────────────────────────────────────── */}
        {activeTab === 'mirofish' && (
          <div className="space-y-3">
            <div className="hud-label">MiroFish Swarm Engine</div>
            <div className="hud-panel p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="text-gray-300 font-mono">{isRunning ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Agents</span>
                <span className="text-gray-300 font-mono">—</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Model</span>
                <span className="text-gray-300 font-mono">gpt-4o</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Platforms</span>
                <span className="text-gray-300 font-mono">CMD_NET + INFORMAL</span>
              </div>
            </div>

            <div className="hud-panel p-3">
              <div className="hud-label mb-2">Architecture</div>
              <div className="text-[10px] text-gray-500 font-mono space-y-1">
                <p>MiroFish/OASIS Engine</p>
                <p>├─ Agent Personas (cmdr, analyst, ops)</p>
                <p>├─ GraphRAG Knowledge Base</p>
                <p>├─ OpenViking Context Memory</p>
                <p>├─ Dual Platform Interaction</p>
                <p>│  ├─ Military Command Net</p>
                <p>│  └─ Informal Channel</p>
                <p>└─ Prediction Report Generator</p>
              </div>
            </div>

            <div className="text-[10px] text-gray-600">
              Set MIROFISH_API_URL to enable live swarm simulations.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
