'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import SimulationPanel from '@/components/SimulationPanel'
import type { UnitMarker, SimulationEvent } from '@/types/military'
import { createInitialState, advanceTick, issueOrder, type SimulationState, type UnitOrder } from '@/lib/simulation-engine'
import Link from 'next/link'

const GlobeViewer = dynamic(() => import('@/components/GlobeViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-sm text-cyan-400">LOADING CESIUMJS</p>
      </div>
    </div>
  ),
})

const TacticalMap = dynamic(() => import('@/components/TacticalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-sm text-cyan-400">LOADING TACTICAL MAP</p>
      </div>
    </div>
  ),
})

// Demo units — INDOPACOM Taiwan contingency scenario
const DEMO_UNITS: UnitMarker[] = [
  // BLUE forces
  { id: 'b1', designation: '7th Fleet', unitType: 'CARRIER_GROUP', faction: 'BLUE', position: { latitude: 35.3, longitude: 139.7 }, heading: 0, speed: 0, strength: 15000, readiness: 0.95, status: 'READY', echelon: 'FLEET' },
  { id: 'b2', designation: 'III MEF', unitType: 'AMPHIBIOUS', faction: 'BLUE', position: { latitude: 26.5, longitude: 127.8 }, heading: 0, speed: 0, strength: 20000, readiness: 0.88, status: 'READY', echelon: 'CORPS' },
  { id: 'b3', designation: '2nd ID', unitType: 'INFANTRY', faction: 'BLUE', position: { latitude: 37.8, longitude: 127.0 }, heading: 180, speed: 0, strength: 17000, readiness: 0.92, status: 'DEFENDING', echelon: 'DIVISION' },
  { id: 'b4', designation: 'CVN-78 Ford CSG', unitType: 'CARRIER_GROUP', faction: 'BLUE', position: { latitude: 22.0, longitude: 135.0 }, heading: 315, speed: 28, strength: 7500, readiness: 0.98, status: 'MOVING', echelon: 'FLEET' },
  { id: 'b5', designation: 'JGSDF Western Army', unitType: 'INFANTRY', faction: 'BLUE', position: { latitude: 33.6, longitude: 131.2 }, heading: 270, speed: 0, strength: 30000, readiness: 0.90, status: 'READY', echelon: 'ARMY_LEVEL' },
  { id: 'b6', designation: '5th Air Force', unitType: 'AIR_FIGHTER', faction: 'BLUE', position: { latitude: 35.7, longitude: 139.3 }, heading: 0, speed: 0, strength: 8000, readiness: 0.94, status: 'READY', echelon: 'WING' },
  { id: 'b7', designation: 'SUBPAC Det', unitType: 'NAVAL_SUBSURFACE', faction: 'BLUE', position: { latitude: 24.0, longitude: 130.0 }, heading: 270, speed: 0, strength: 2000, readiness: 0.96, status: 'READY', echelon: 'SQUADRON' },
  // RED forces
  { id: 'r1', designation: '73rd Group Army', unitType: 'ARMOR', faction: 'RED', position: { latitude: 26.1, longitude: 119.3 }, heading: 90, speed: 0, strength: 45000, readiness: 0.85, status: 'READY', echelon: 'CORPS' },
  { id: 'r2', designation: 'ET Navy', unitType: 'NAVAL_SURFACE', faction: 'RED', position: { latitude: 30.2, longitude: 122.1 }, heading: 135, speed: 0, strength: 25000, readiness: 0.80, status: 'READY', echelon: 'FLEET' },
  { id: 'r3', designation: 'PLARF East', unitType: 'MISSILE', faction: 'RED', position: { latitude: 27.0, longitude: 117.0 }, heading: 0, speed: 0, strength: 8000, readiness: 0.95, status: 'READY', echelon: 'BRIGADE' },
  { id: 'r4', designation: 'PLAAF ET', unitType: 'AIR_FIGHTER', faction: 'RED', position: { latitude: 28.5, longitude: 118.5 }, heading: 90, speed: 0, strength: 12000, readiness: 0.88, status: 'READY', echelon: 'WING' },
  { id: 'r5', designation: '71st Group Army', unitType: 'INFANTRY', faction: 'RED', position: { latitude: 32.0, longitude: 118.8 }, heading: 0, speed: 0, strength: 40000, readiness: 0.82, status: 'READY', echelon: 'CORPS' },
  { id: 'r6', designation: 'SSF Cyber', unitType: 'CYBER', faction: 'RED', position: { latitude: 39.9, longitude: 116.4 }, heading: 0, speed: 0, strength: 5000, readiness: 0.90, status: 'READY', echelon: 'BRIGADE' },
  { id: 'r7', designation: 'ST Navy', unitType: 'NAVAL_SURFACE', faction: 'RED', position: { latitude: 18.2, longitude: 109.5 }, heading: 0, speed: 0, strength: 18000, readiness: 0.78, status: 'READY', echelon: 'FLEET' },
  // GREEN forces (Taiwan)
  { id: 'g1', designation: 'ROC Army', unitType: 'INFANTRY', faction: 'GREEN', position: { latitude: 24.1, longitude: 120.7 }, heading: 270, speed: 0, strength: 130000, readiness: 0.75, status: 'DEFENDING', echelon: 'ARMY_LEVEL' },
  { id: 'g2', designation: 'ROCAF', unitType: 'AIR_FIGHTER', faction: 'GREEN', position: { latitude: 24.8, longitude: 121.0 }, heading: 0, speed: 0, strength: 35000, readiness: 0.80, status: 'READY', echelon: 'WING' },
  { id: 'g3', designation: 'ROCN', unitType: 'NAVAL_SURFACE', faction: 'GREEN', position: { latitude: 22.6, longitude: 120.3 }, heading: 0, speed: 0, strength: 15000, readiness: 0.77, status: 'READY', echelon: 'FLEET' },
  // EUCOM
  { id: 'e1', designation: 'V Corps', unitType: 'ARMOR', faction: 'BLUE', position: { latitude: 50.1, longitude: 8.7 }, heading: 90, speed: 0, strength: 35000, readiness: 0.90, status: 'READY', echelon: 'CORPS' },
  { id: 'e2', designation: '6th Fleet', unitType: 'NAVAL_SURFACE', faction: 'BLUE', position: { latitude: 36.1, longitude: 14.5 }, heading: 0, speed: 0, strength: 12000, readiness: 0.92, status: 'READY', echelon: 'FLEET' },
]

type ViewMode = '3d' | '2d'
type OrderMode = null | 'MOVE' | 'ATTACK' | 'DEFEND' | 'PATROL' | 'WITHDRAW' | 'RECON'

export default function GlobePage() {
  const [simState, setSimState] = useState<SimulationState>(() => createInitialState(DEMO_UNITS))
  const [selectedTheater, setSelectedTheater] = useState('INDOPACOM')
  const [selectedUnit, setSelectedUnit] = useState<UnitMarker | null>(null)
  const [showPanel, setShowPanel] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [orderMode, setOrderMode] = useState<OrderMode>(null)
  const [tickSpeed, setTickSpeed] = useState(1000) // ms per tick
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Simulation tick loop
  useEffect(() => {
    if (simState.isRunning) {
      tickRef.current = setInterval(() => {
        setSimState(prev => advanceTick(prev))
      }, tickSpeed)
    } else if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [simState.isRunning, tickSpeed])

  // Keep selectedUnit in sync with sim state
  useEffect(() => {
    if (selectedUnit) {
      const updated = simState.units.find(u => u.id === selectedUnit.id)
      if (updated && (updated.strength !== selectedUnit.strength || updated.status !== selectedUnit.status || updated.position.latitude !== selectedUnit.position.latitude)) {
        setSelectedUnit(updated)
      }
    }
  }, [simState.units]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnitSelect = useCallback((unit: UnitMarker) => {
    setSelectedUnit(unit)
    setOrderMode(null)
  }, [])

  const handleMapClick = useCallback((lat: number, lon: number) => {
    // If we have a selected unit and an order mode, issue the order
    if (selectedUnit && orderMode) {
      const order: UnitOrder = {
        unitId: selectedUnit.id,
        type: orderMode === 'ATTACK' ? 'ATTACK' : orderMode,
        destination: { latitude: lat, longitude: lon },
      }
      setSimState(prev => issueOrder(prev, order))
      setOrderMode(null)
      return
    }
    setSelectedUnit(null)
  }, [selectedUnit, orderMode])

  const startSimulation = useCallback(() => {
    setSimState(prev => ({ ...prev, isRunning: true }))
  }, [])

  const pauseSimulation = useCallback(() => {
    setSimState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const handleInjectEvent = useCallback((event: { type: string; description: string; magnitude: number }) => {
    setSimState(prev => ({
      ...prev,
      events: [
        ...prev.events,
        {
          tick: prev.tick,
          type: 'ESCALATION',
          title: `[INJECTED] ${event.type}`,
          description: event.description,
          severity: event.magnitude >= 0.7 ? 'CRITICAL' : event.magnitude >= 0.4 ? 'WARNING' : 'INFO',
        },
      ],
    }))
  }, [])

  const theaters = ['GLOBAL', 'INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM']

  const orderTypes: { id: OrderMode; label: string; color: string }[] = [
    { id: 'MOVE', label: 'MOVE', color: 'text-cyan-400' },
    { id: 'ATTACK', label: 'ATTACK', color: 'text-red-400' },
    { id: 'DEFEND', label: 'DEFEND', color: 'text-green-400' },
    { id: 'PATROL', label: 'PATROL', color: 'text-amber-400' },
    { id: 'WITHDRAW', label: 'WITHDRAW', color: 'text-orange-400' },
    { id: 'RECON', label: 'RECON', color: 'text-purple-400' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top bar */}
      <header className="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950/95 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-sm">
            <span className="text-white">Ender</span>
            <span className="text-cyan-400">AI</span>
          </Link>
          <div className="h-4 w-px bg-gray-800" />

          {/* View mode toggle */}
          <div className="flex bg-gray-800 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${viewMode === '3d' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
            >
              3D GLOBE
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${viewMode === '2d' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
            >
              2D TACTICAL
            </button>
          </div>

          <div className="h-4 w-px bg-gray-800" />

          {/* Theater selector */}
          <div className="flex gap-1">
            {theaters.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTheater(t)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  selectedTheater === t ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Tick speed */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-gray-500">SPEED:</span>
            {[{ ms: 2000, label: '0.5x' }, { ms: 1000, label: '1x' }, { ms: 500, label: '2x' }, { ms: 200, label: '5x' }].map(s => (
              <button
                key={s.ms}
                onClick={() => setTickSpeed(s.ms)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${tickSpeed === s.ms ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-800" />

          <Link href="/feeds" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">INTEL FEEDS</Link>
          <Link href="/simulation" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">SCENARIOS</Link>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="text-[10px] font-mono text-gray-400 hover:text-cyan-400"
          >
            {showPanel ? 'HIDE' : 'PANEL'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map view */}
        <div className="flex-1 relative">
          {viewMode === '3d' ? (
            <GlobeViewer
              units={simState.units}
              selectedTheater={selectedTheater}
              onUnitSelect={handleUnitSelect}
              onMapClick={handleMapClick}
              simulationActive={simState.isRunning}
            />
          ) : (
            <TacticalMap
              units={simState.units}
              selectedTheater={selectedTheater}
              onUnitSelect={handleUnitSelect}
              onMapClick={handleMapClick}
              detections={simState.detections}
            />
          )}

          {/* Order mode indicator */}
          {orderMode && selectedUnit && (
            <div className="absolute top-4 right-4 hud-panel p-3 z-40">
              <div className="text-xs font-mono text-amber-400 mb-1">
                ISSUING ORDER: {orderMode}
              </div>
              <div className="text-[10px] text-gray-400">
                Click map to set destination for {selectedUnit.designation}
              </div>
              <button
                onClick={() => setOrderMode(null)}
                className="text-[10px] font-mono text-red-400 mt-2 hover:text-red-300"
              >
                CANCEL
              </button>
            </div>
          )}

          {/* Selected unit detail + order buttons */}
          {selectedUnit && !orderMode && (
            <div className="absolute top-4 left-4 hud-panel p-4 w-80 z-40">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: selectedUnit.faction === 'BLUE' ? '#3b82f6' : selectedUnit.faction === 'RED' ? '#ef4444' : '#22c55e' }}
                >
                  {selectedUnit.designation}
                </span>
                <button onClick={() => setSelectedUnit(null)} className="text-gray-500 hover:text-gray-300 text-xs">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                <div className="text-gray-500">Type</div>
                <div className="font-mono">{selectedUnit.unitType}</div>
                <div className="text-gray-500">Echelon</div>
                <div className="font-mono">{selectedUnit.echelon}</div>
                <div className="text-gray-500">Strength</div>
                <div className="font-mono">{selectedUnit.strength.toLocaleString()}</div>
                <div className="text-gray-500">Readiness</div>
                <div className="font-mono">{(selectedUnit.readiness * 100).toFixed(0)}%</div>
                <div className="text-gray-500">Status</div>
                <div className={`font-mono ${
                  selectedUnit.status === 'ENGAGED' ? 'text-red-400' :
                  selectedUnit.status === 'DESTROYED' ? 'text-gray-600' :
                  selectedUnit.status === 'MOVING' ? 'text-amber-400' :
                  'text-green-400'
                }`}>{selectedUnit.status}</div>
                <div className="text-gray-500">Position</div>
                <div className="font-mono text-[10px]">{selectedUnit.position.latitude.toFixed(2)}, {selectedUnit.position.longitude.toFixed(2)}</div>
                {selectedUnit.speed > 0 && (
                  <>
                    <div className="text-gray-500">Speed</div>
                    <div className="font-mono">{selectedUnit.speed.toFixed(0)} km/h HDG {selectedUnit.heading.toFixed(0)}°</div>
                  </>
                )}
              </div>

              {/* Order buttons */}
              {selectedUnit.status !== 'DESTROYED' && (
                <div>
                  <div className="hud-label mb-1">Issue Order</div>
                  <div className="flex flex-wrap gap-1">
                    {orderTypes.map(o => (
                      <button
                        key={o.id}
                        onClick={() => setOrderMode(o.id)}
                        className={`px-2 py-1 text-[10px] font-mono rounded bg-gray-800 hover:bg-gray-700 ${o.color} transition-colors`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simulation panel */}
        {showPanel && (
          <div className="w-80 flex-shrink-0">
            <SimulationPanel
              units={simState.units}
              events={simState.events}
              isRunning={simState.isRunning}
              currentTick={simState.tick}
              onStartSimulation={startSimulation}
              onPauseSimulation={pauseSimulation}
              onInjectEvent={handleInjectEvent}
            />
          </div>
        )}
      </div>
    </div>
  )
}
