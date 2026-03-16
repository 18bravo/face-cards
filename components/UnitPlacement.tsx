'use client'

import { useState } from 'react'
import type { UnitMarker } from '@/types/military'

interface UnitPlacementProps {
  onPlace: (unit: Omit<UnitMarker, 'id'>) => void
  onCancel: () => void
  pendingPosition: { latitude: number; longitude: number } | null
}

const UNIT_TYPES = [
  'INFANTRY', 'ARMOR', 'ARTILLERY', 'AIR_DEFENSE', 'AVIATION',
  'NAVAL_SURFACE', 'NAVAL_SUBSURFACE', 'CARRIER_GROUP', 'AMPHIBIOUS',
  'SPECIAL_OPERATIONS', 'CYBER', 'MISSILE', 'AIR_FIGHTER', 'AIR_BOMBER',
  'AIR_TRANSPORT', 'AIR_ISR', 'UAV', 'LOGISTICS', 'COMMAND',
] as const

const ECHELONS = [
  'FIRE_TEAM', 'SQUAD', 'PLATOON', 'COMPANY', 'BATTALION', 'REGIMENT',
  'BRIGADE', 'DIVISION', 'CORPS', 'ARMY_LEVEL', 'THEATER', 'FLEET',
  'SQUADRON', 'WING',
] as const

const FACTIONS = ['BLUE', 'RED', 'GREEN', 'NEUTRAL'] as const

const PRESETS: { label: string; data: Partial<Omit<UnitMarker, 'id' | 'position'>> }[] = [
  { label: 'Infantry Division', data: { unitType: 'INFANTRY', echelon: 'DIVISION', strength: 15000, faction: 'BLUE' } },
  { label: 'Armored Brigade', data: { unitType: 'ARMOR', echelon: 'BRIGADE', strength: 5000, faction: 'BLUE' } },
  { label: 'Carrier Strike Group', data: { unitType: 'CARRIER_GROUP', echelon: 'FLEET', strength: 7500, faction: 'BLUE' } },
  { label: 'Fighter Wing', data: { unitType: 'AIR_FIGHTER', echelon: 'WING', strength: 3500, faction: 'BLUE' } },
  { label: 'Missile Brigade', data: { unitType: 'MISSILE', echelon: 'BRIGADE', strength: 3000, faction: 'RED' } },
  { label: 'Mech Infantry Corps', data: { unitType: 'INFANTRY', echelon: 'CORPS', strength: 40000, faction: 'RED' } },
  { label: 'Naval Fleet', data: { unitType: 'NAVAL_SURFACE', echelon: 'FLEET', strength: 15000, faction: 'RED' } },
  { label: 'SOF Detachment', data: { unitType: 'SPECIAL_OPERATIONS', echelon: 'BATTALION', strength: 500, faction: 'BLUE' } },
]

export default function UnitPlacement({ onPlace, onCancel, pendingPosition }: UnitPlacementProps) {
  const [designation, setDesignation] = useState('')
  const [unitType, setUnitType] = useState<string>('INFANTRY')
  const [echelon, setEchelon] = useState<string>('BRIGADE')
  const [faction, setFaction] = useState<string>('BLUE')
  const [strength, setStrength] = useState(5000)

  function applyPreset(preset: typeof PRESETS[number]) {
    if (preset.data.unitType) setUnitType(preset.data.unitType)
    if (preset.data.echelon) setEchelon(preset.data.echelon)
    if (preset.data.faction) setFaction(preset.data.faction as string)
    if (preset.data.strength) setStrength(preset.data.strength)
  }

  function handlePlace() {
    if (!pendingPosition || !designation.trim()) return

    onPlace({
      designation: designation.trim(),
      unitType,
      echelon,
      faction: faction as 'BLUE' | 'RED' | 'GREEN' | 'NEUTRAL',
      strength,
      readiness: 1.0,
      heading: 0,
      speed: 0,
      status: 'READY',
      position: pendingPosition,
    })

    setDesignation('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="hud-label">Deploy Unit</div>
        <button onClick={onCancel} className="text-[10px] font-mono text-red-400 hover:text-red-300">
          CANCEL
        </button>
      </div>

      {/* Quick presets */}
      <div>
        <div className="hud-label mb-1">Quick Presets</div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-1.5 py-0.5 text-[9px] font-mono bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Designation */}
      <div>
        <label className="hud-label">Designation</label>
        <input
          type="text"
          value={designation}
          onChange={e => setDesignation(e.target.value)}
          placeholder="e.g. 1st Armored DIV"
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300"
        />
      </div>

      {/* Faction */}
      <div>
        <label className="hud-label">Faction</label>
        <div className="flex gap-1 mt-1">
          {FACTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFaction(f)}
              className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${
                faction === f
                  ? f === 'BLUE' ? 'bg-blue-600 text-white'
                  : f === 'RED' ? 'bg-red-600 text-white'
                  : f === 'GREEN' ? 'bg-green-600 text-white'
                  : 'bg-amber-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Unit type */}
      <div>
        <label className="hud-label">Unit Type</label>
        <select
          value={unitType}
          onChange={e => setUnitType(e.target.value)}
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300"
        >
          {UNIT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Echelon */}
      <div>
        <label className="hud-label">Echelon</label>
        <select
          value={echelon}
          onChange={e => setEchelon(e.target.value)}
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300"
        >
          {ECHELONS.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Strength */}
      <div>
        <label className="hud-label">Strength: {strength.toLocaleString()}</label>
        <input
          type="range"
          min={100}
          max={200000}
          step={100}
          value={strength}
          onChange={e => setStrength(parseInt(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      {/* Position */}
      <div className="hud-panel p-2 text-center">
        {pendingPosition ? (
          <div className="text-xs font-mono text-cyan-400">
            POSITION: {pendingPosition.latitude.toFixed(4)}, {pendingPosition.longitude.toFixed(4)}
          </div>
        ) : (
          <div className="text-xs font-mono text-amber-400">
            CLICK MAP TO SET POSITION
          </div>
        )}
      </div>

      <button
        onClick={handlePlace}
        disabled={!pendingPosition || !designation.trim()}
        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-mono rounded transition-colors"
      >
        DEPLOY UNIT
      </button>
    </div>
  )
}
