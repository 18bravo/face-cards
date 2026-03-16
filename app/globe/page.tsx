'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SimulationPanel from '@/components/SimulationPanel'
import type { UnitMarker, SimulationEvent } from '@/types/military'
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

// Demo units for initial display
const DEMO_UNITS: UnitMarker[] = [
  {
    id: 'demo-1', designation: '7th Fleet', unitType: 'CARRIER_GROUP', faction: 'BLUE',
    position: { latitude: 35.3, longitude: 139.7 }, heading: 0, speed: 0,
    strength: 15000, readiness: 0.95, status: 'READY', echelon: 'FLEET',
  },
  {
    id: 'demo-2', designation: 'III MEF', unitType: 'AMPHIBIOUS', faction: 'BLUE',
    position: { latitude: 26.5, longitude: 127.8 }, heading: 0, speed: 0,
    strength: 20000, readiness: 0.88, status: 'READY', echelon: 'CORPS',
  },
  {
    id: 'demo-3', designation: '2nd ID', unitType: 'INFANTRY', faction: 'BLUE',
    position: { latitude: 37.8, longitude: 127.0 }, heading: 180, speed: 0,
    strength: 17000, readiness: 0.92, status: 'DEFENDING', echelon: 'DIVISION',
  },
  {
    id: 'demo-4', designation: 'PLA 73rd Group Army', unitType: 'ARMOR', faction: 'RED',
    position: { latitude: 26.1, longitude: 119.3 }, heading: 90, speed: 0,
    strength: 45000, readiness: 0.85, status: 'READY', echelon: 'CORPS',
  },
  {
    id: 'demo-5', designation: 'PLA Eastern Theater Navy', unitType: 'NAVAL_SURFACE', faction: 'RED',
    position: { latitude: 30.2, longitude: 122.1 }, heading: 135, speed: 0,
    strength: 25000, readiness: 0.80, status: 'MOVING', echelon: 'FLEET',
  },
  {
    id: 'demo-6', designation: 'PLA Rocket Force', unitType: 'MISSILE', faction: 'RED',
    position: { latitude: 27.0, longitude: 117.0 }, heading: 0, speed: 0,
    strength: 8000, readiness: 0.95, status: 'READY', echelon: 'BRIGADE',
  },
  {
    id: 'demo-7', designation: 'JGSDF Western Army', unitType: 'INFANTRY', faction: 'BLUE',
    position: { latitude: 33.6, longitude: 131.2 }, heading: 270, speed: 0,
    strength: 30000, readiness: 0.90, status: 'READY', echelon: 'ARMY_LEVEL',
  },
  {
    id: 'demo-8', designation: 'ROC Army', unitType: 'INFANTRY', faction: 'GREEN',
    position: { latitude: 24.1, longitude: 120.7 }, heading: 270, speed: 0,
    strength: 130000, readiness: 0.75, status: 'DEFENDING', echelon: 'ARMY_LEVEL',
  },
  {
    id: 'demo-9', designation: 'CVN-78 Gerald R. Ford CSG', unitType: 'CARRIER_GROUP', faction: 'BLUE',
    position: { latitude: 22.0, longitude: 135.0 }, heading: 315, speed: 28,
    strength: 7500, readiness: 0.98, status: 'MOVING', echelon: 'FLEET',
  },
  {
    id: 'demo-10', designation: 'PLA Air Force Eastern Theater', unitType: 'AIR_FIGHTER', faction: 'RED',
    position: { latitude: 28.5, longitude: 118.5 }, heading: 90, speed: 0,
    strength: 12000, readiness: 0.88, status: 'READY', echelon: 'WING',
  },
  // EUCOM theater units
  {
    id: 'demo-11', designation: 'V Corps', unitType: 'ARMOR', faction: 'BLUE',
    position: { latitude: 50.1, longitude: 8.7 }, heading: 90, speed: 0,
    strength: 35000, readiness: 0.90, status: 'READY', echelon: 'CORPS',
  },
  {
    id: 'demo-12', designation: '6th Fleet', unitType: 'NAVAL_SURFACE', faction: 'BLUE',
    position: { latitude: 36.1, longitude: 14.5 }, heading: 0, speed: 0,
    strength: 12000, readiness: 0.92, status: 'READY', echelon: 'FLEET',
  },
]

export default function GlobePage() {
  const [units] = useState<UnitMarker[]>(DEMO_UNITS)
  const [selectedTheater, setSelectedTheater] = useState('INDOPACOM')
  const [selectedUnit, setSelectedUnit] = useState<UnitMarker | null>(null)
  const [events] = useState<SimulationEvent[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTick, setCurrentTick] = useState(0)
  const [showPanel, setShowPanel] = useState(true)

  const handleUnitSelect = useCallback((unit: UnitMarker) => {
    setSelectedUnit(unit)
  }, [])

  const handleMapClick = useCallback((lat: number, lon: number) => {
    setSelectedUnit(null)
    console.log('Map clicked:', lat, lon)
  }, [])

  const theaters = ['GLOBAL', 'INDOPACOM', 'EUCOM', 'CENTCOM', 'AFRICOM', 'SOUTHCOM', 'NORTHCOM']

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
          <div className="flex gap-1">
            {theaters.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTheater(t)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  selectedTheater === t
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/feeds" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            INTEL FEEDS
          </Link>
          <Link href="/simulation" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            SCENARIOS
          </Link>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="text-[10px] font-mono text-gray-400 hover:text-cyan-400"
          >
            {showPanel ? 'HIDE PANEL' : 'SHOW PANEL'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Globe */}
        <div className="flex-1 relative">
          <GlobeViewer
            units={units}
            selectedTheater={selectedTheater}
            onUnitSelect={handleUnitSelect}
            onMapClick={handleMapClick}
            simulationActive={isRunning}
          />

          {/* Selected unit detail overlay */}
          {selectedUnit && (
            <div className="absolute top-4 left-4 hud-panel p-4 w-72 z-40">
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
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-mono">{selectedUnit.unitType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Echelon</span>
                  <span className="font-mono">{selectedUnit.echelon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Strength</span>
                  <span className="font-mono">{selectedUnit.strength.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Readiness</span>
                  <span className="font-mono">{(selectedUnit.readiness * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-mono ${
                    selectedUnit.status === 'ENGAGED' ? 'text-red-400' :
                    selectedUnit.status === 'MOVING' ? 'text-amber-400' :
                    'text-green-400'
                  }`}>{selectedUnit.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Position</span>
                  <span className="font-mono text-[10px]">
                    {selectedUnit.position.latitude.toFixed(2)}, {selectedUnit.position.longitude.toFixed(2)}
                  </span>
                </div>
                {selectedUnit.speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Speed</span>
                    <span className="font-mono">{selectedUnit.speed} km/h HDG {selectedUnit.heading}°</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Simulation panel */}
        {showPanel && (
          <div className="w-80 flex-shrink-0">
            <SimulationPanel
              units={units}
              events={events}
              isRunning={isRunning}
              currentTick={currentTick}
              onStartSimulation={() => setIsRunning(true)}
              onPauseSimulation={() => setIsRunning(false)}
              onInjectEvent={(event) => {
                console.log('Inject event:', event)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
