'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ScenarioSummary } from '@/types/military'

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    theater: 'GLOBAL',
  })

  useEffect(() => {
    fetchScenarios()
  }, [])

  async function fetchScenarios() {
    try {
      const res = await fetch('/api/scenarios')
      if (res.ok) {
        const data = await res.json()
        setScenarios(data.scenarios || [])
      }
    } catch (err) {
      console.error('Failed to fetch scenarios:', err)
    } finally {
      setLoading(false)
    }
  }

  async function createScenario() {
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScenario),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewScenario({ name: '', description: '', theater: 'GLOBAL' })
        fetchScenarios()
      }
    } catch (err) {
      console.error('Failed to create scenario:', err)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <header className="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950/95">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-sm">
            <span className="text-white">Ender</span>
            <span className="text-cyan-400">AI</span>
          </Link>
          <div className="h-4 w-px bg-gray-800" />
          <span className="text-xs font-mono text-gray-400">SCENARIO MANAGEMENT</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/globe" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            GLOBE
          </Link>
          <Link href="/feeds" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            INTEL FEEDS
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Scenarios</h1>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded transition-colors"
            >
              + NEW SCENARIO
            </button>
          </div>

          {/* Create scenario form */}
          {showCreate && (
            <div className="hud-panel p-4 space-y-3">
              <div className="hud-label">Create New Scenario</div>
              <input
                type="text"
                value={newScenario.name}
                onChange={e => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Scenario name..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
              />
              <textarea
                value={newScenario.description}
                onChange={e => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the operational scenario..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 resize-none"
              />
              <select
                value={newScenario.theater}
                onChange={e => setNewScenario(prev => ({ ...prev, theater: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
              >
                <option value="GLOBAL">GLOBAL</option>
                <option value="INDOPACOM">INDOPACOM</option>
                <option value="EUCOM">EUCOM</option>
                <option value="CENTCOM">CENTCOM</option>
                <option value="AFRICOM">AFRICOM</option>
                <option value="SOUTHCOM">SOUTHCOM</option>
                <option value="NORTHCOM">NORTHCOM</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={createScenario}
                  disabled={!newScenario.name || !newScenario.description}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-mono rounded transition-colors"
                >
                  CREATE
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono rounded transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Scenario list */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading scenarios...</div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-gray-500">No scenarios yet.</p>
              <p className="text-gray-600 text-sm">
                Create a new scenario manually or generate one from intelligence feeds.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {scenarios.map(scenario => (
                <Link
                  key={scenario.id}
                  href={`/globe?scenario=${scenario.id}`}
                  className="hud-panel p-4 hover:border-cyan-400/50 transition-colors block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{scenario.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="font-mono">{scenario.theater}</span>
                        <span>{scenario.unitCount} units</span>
                        <span>Tick {scenario.currentTick}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      scenario.status === 'RUNNING' ? 'bg-green-400/10 text-green-400' :
                      scenario.status === 'PAUSED' ? 'bg-amber-400/10 text-amber-400' :
                      scenario.status === 'COMPLETED' ? 'bg-gray-400/10 text-gray-400' :
                      'bg-cyan-400/10 text-cyan-400'
                    }`}>
                      {scenario.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
