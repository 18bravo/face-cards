'use client'

import { useState } from 'react'
import type { UnitMarker, SimulationEvent } from '@/types/military'

interface SimulationPanelProps {
  scenarioId?: string
  units: UnitMarker[]
  events: SimulationEvent[]
  isRunning: boolean
  currentTick: number
  onStartSimulation: () => void
  onPauseSimulation: () => void
  onInjectEvent: (event: { type: string; description: string; magnitude: number }) => void
}

export default function SimulationPanel({
  scenarioId,
  units,
  events,
  isRunning,
  currentTick,
  onStartSimulation,
  onPauseSimulation,
  onInjectEvent,
}: SimulationPanelProps) {
  const [activeTab, setActiveTab] = useState<'units' | 'events' | 'inject' | 'mirofish'>('units')
  const [injectType, setInjectType] = useState('event')
  const [injectDesc, setInjectDesc] = useState('')
  const [injectMagnitude, setInjectMagnitude] = useState(0.5)

  const blueUnits = units.filter(u => u.faction === 'BLUE')
  const redUnits = units.filter(u => u.faction === 'RED')
  const greenUnits = units.filter(u => u.faction === 'GREEN')

  const tabs = [
    { id: 'units' as const, label: 'ORBAT', count: units.length },
    { id: 'events' as const, label: 'EVENTS', count: events.length },
    { id: 'inject' as const, label: 'INJECT' },
    { id: 'mirofish' as const, label: 'MIROFISH' },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-950/95 border-l border-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="hud-label">Simulation Control</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="font-mono text-xs text-gray-400">
              TICK {currentTick}
            </span>
          </div>
        </div>

        {/* Force summary */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="hud-panel p-2 text-center">
            <div className="text-blue-400 font-mono font-bold">{blueUnits.length}</div>
            <div className="text-gray-500">BLUE</div>
          </div>
          <div className="hud-panel p-2 text-center">
            <div className="text-red-400 font-mono font-bold">{redUnits.length}</div>
            <div className="text-gray-500">RED</div>
          </div>
          <div className="hud-panel p-2 text-center">
            <div className="text-green-400 font-mono font-bold">{greenUnits.length}</div>
            <div className="text-gray-500">GREEN</div>
          </div>
        </div>

        {/* Play controls */}
        <div className="flex gap-2 mt-3">
          {!isRunning ? (
            <button
              onClick={onStartSimulation}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded transition-colors"
            >
              ▶ START SIMULATION
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono rounded transition-colors"
            >
              ⏸ PAUSE
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-mono transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <span className="ml-1 text-gray-600">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'units' && (
          <>
            {units.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-8">
                No units deployed. Create a scenario or load seed data.
              </div>
            ) : (
              units.map(unit => (
                <div
                  key={unit.id}
                  className="hud-panel p-2 cursor-pointer hover:border-cyan-400/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: unit.faction === 'BLUE' ? '#3b82f6' : unit.faction === 'RED' ? '#ef4444' : '#22c55e' }}
                      >
                        {unit.designation}
                      </span>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {unit.unitType} &middot; {unit.echelon} &middot; STR {unit.strength.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-mono ${
                        unit.status === 'ENGAGED' ? 'text-red-400' :
                        unit.status === 'MOVING' ? 'text-amber-400' :
                        'text-green-400'
                      }`}>
                        {unit.status}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        R:{(unit.readiness * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'events' && (
          <>
            {events.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-8">
                No events yet. Start a simulation.
              </div>
            ) : (
              events.slice().reverse().map((event, i) => (
                <div key={i} className="hud-panel p-2">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-mono mt-0.5 ${
                      event.severity === 'FLASH' ? 'text-red-400' :
                      event.severity === 'CRITICAL' ? 'text-orange-400' :
                      event.severity === 'WARNING' ? 'text-amber-400' :
                      'text-gray-400'
                    }`}>
                      T{event.tick}
                    </span>
                    <div>
                      <div className="text-xs font-medium">{event.title}</div>
                      <div className="text-[10px] text-gray-500">{event.description}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'inject' && (
          <div className="space-y-3">
            <div className="hud-label">God&apos;s Eye Intervention</div>
            <p className="text-xs text-gray-500">
              Inject a variable into the running MiroFish simulation to alter conditions.
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
                  onInjectEvent({
                    type: injectType,
                    description: injectDesc,
                    magnitude: injectMagnitude,
                  })
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

        {activeTab === 'mirofish' && (
          <div className="space-y-3">
            <div className="hud-label">MiroFish Swarm Engine</div>
            <div className="hud-panel p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="text-gray-300 font-mono">
                  {isRunning ? 'ACTIVE' : 'STANDBY'}
                </span>
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
              <div className="hud-label mb-2">Simulation Architecture</div>
              <div className="text-[10px] text-gray-500 font-mono space-y-1">
                <p>MiroFish/OASIS Engine</p>
                <p>├─ Agent Personas (commander, analyst, operator)</p>
                <p>├─ GraphRAG Knowledge Base</p>
                <p>├─ OpenViking Context Memory</p>
                <p>├─ Dual Platform Interaction</p>
                <p>│  ├─ Military Command Net</p>
                <p>│  └─ Informal Channel</p>
                <p>└─ Prediction Report Generator</p>
              </div>
            </div>

            <div className="text-[10px] text-gray-600">
              Connect to MiroFish backend at MIROFISH_API_URL to enable live simulations.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
