'use client'

import { useMemo } from 'react'
import type { SimulationEvent } from '@/types/military'

interface TimelineProps {
  events: SimulationEvent[]
  currentTick: number
  maxTick: number
  onSeekTick: (tick: number) => void
  isRunning: boolean
}

export default function Timeline({
  events,
  currentTick,
  maxTick,
  onSeekTick,
  isRunning,
}: TimelineProps) {
  // Group events by tick for the heatmap
  const tickHeatmap = useMemo(() => {
    const map = new Map<number, { count: number; maxSeverity: string }>()
    for (const event of events) {
      const existing = map.get(event.tick)
      if (existing) {
        existing.count++
        if (severityRank(event.severity) > severityRank(existing.maxSeverity)) {
          existing.maxSeverity = event.severity
        }
      } else {
        map.set(event.tick, { count: 1, maxSeverity: event.severity })
      }
    }
    return map
  }, [events])

  // Force strength over time (sampled from SITREP events)
  const forceData = useMemo(() => {
    const data: { tick: number; blue: number; red: number; green: number }[] = []
    for (const event of events) {
      if (event.type === 'SIMULATION_TICK' && event.description) {
        const blueMatch = event.description.match(/BLUE: \d+ units \(([\d,]+) pers\)/)
        const redMatch = event.description.match(/RED: \d+ units \(([\d,]+) pers\)/)
        const greenMatch = event.description.match(/GREEN: \d+ units \(([\d,]+) pers\)/)
        data.push({
          tick: event.tick,
          blue: blueMatch ? parseInt(blueMatch[1].replace(/,/g, '')) : 0,
          red: redMatch ? parseInt(redMatch[1].replace(/,/g, '')) : 0,
          green: greenMatch ? parseInt(greenMatch[1].replace(/,/g, '')) : 0,
        })
      }
    }
    return data
  }, [events])

  const effectiveMax = Math.max(maxTick, 1)

  return (
    <div className="space-y-2">
      {/* Tick scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="hud-label">Timeline</div>
          <span className="text-[10px] font-mono text-gray-400">T+{currentTick}h / {maxTick}h</span>
        </div>

        <div className="relative h-6 bg-gray-800 rounded overflow-hidden">
          {/* Event heatmap */}
          {Array.from(tickHeatmap.entries()).map(([tick, data]) => (
            <div
              key={tick}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${(tick / effectiveMax) * 100}%`,
                backgroundColor: severityColor(data.maxSeverity),
                opacity: Math.min(1, 0.3 + data.count * 0.15),
              }}
            />
          ))}

          {/* Current position marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10"
            style={{ left: `${(currentTick / effectiveMax) * 100}%` }}
          />

          {/* Clickable scrubber */}
          <input
            type="range"
            min={0}
            max={maxTick}
            value={currentTick}
            onChange={e => onSeekTick(parseInt(e.target.value))}
            disabled={isRunning}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Force strength mini chart */}
      {forceData.length > 1 && (
        <div className="space-y-1">
          <div className="hud-label">Force Strength</div>
          <div className="relative h-20 bg-gray-800/50 rounded overflow-hidden">
            <ForceChart data={forceData} />
          </div>
        </div>
      )}

      {/* Recent notable events */}
      <div className="space-y-1">
        <div className="hud-label">Recent Events</div>
        {events.length === 0 ? (
          <div className="text-[10px] text-gray-600 py-2 text-center">No events yet</div>
        ) : (
          events
            .filter(e => e.type !== 'SIMULATION_TICK')
            .slice(-8)
            .reverse()
            .map((event, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className={`font-mono mt-px flex-shrink-0 ${severityTextColor(event.severity)}`}>
                  T{event.tick}
                </span>
                <span className="text-gray-400 truncate">{event.title}</span>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

// ── Mini force chart (pure SVG) ─────────────────────────────

function ForceChart({ data }: { data: { tick: number; blue: number; red: number; green: number }[] }) {
  if (data.length < 2) return null

  const maxPersonnel = Math.max(...data.flatMap(d => [d.blue, d.red, d.green]))
  const maxTick = data[data.length - 1].tick || 1
  const w = 100
  const h = 100

  function toPath(values: number[]): string {
    return values.map((v, i) => {
      const x = (data[i].tick / maxTick) * w
      const y = h - (v / maxPersonnel) * h
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <path d={toPath(data.map(d => d.blue))} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <path d={toPath(data.map(d => d.red))} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      {data.some(d => d.green > 0) && (
        <path d={toPath(data.map(d => d.green))} fill="none" stroke="#22c55e" strokeWidth="1.5" />
      )}
    </svg>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function severityRank(severity: string): number {
  switch (severity) {
    case 'FLASH': return 4
    case 'CRITICAL': return 3
    case 'WARNING': return 2
    default: return 1
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'FLASH': return '#ef4444'
    case 'CRITICAL': return '#f97316'
    case 'WARNING': return '#f59e0b'
    default: return '#64748b'
  }
}

function severityTextColor(severity: string): string {
  switch (severity) {
    case 'FLASH': return 'text-red-400'
    case 'CRITICAL': return 'text-orange-400'
    case 'WARNING': return 'text-amber-400'
    default: return 'text-gray-500'
  }
}
