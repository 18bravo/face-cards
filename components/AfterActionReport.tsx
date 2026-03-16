'use client'

import type { AfterActionReport } from '@/lib/simulation-engine'
import { FACTION_COLORS } from '@/types/military'

interface Props {
  report: AfterActionReport
  onClose: () => void
}

const factionColor = (f: string) =>
  FACTION_COLORS[f as keyof typeof FACTION_COLORS] ?? '#888'

export default function AfterActionReport({ report, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="hud-panel w-[640px] max-h-[80vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-white">AFTER-ACTION REPORT</h2>
            <div className="text-xs text-gray-400 font-mono">
              Simulation duration: T+{report.totalTicks}h
              {report.winner && (
                <span className="ml-3" style={{ color: factionColor(report.winner) }}>
                  ASSESSMENT: {report.winner} ADVANTAGE
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-sm font-mono px-2 py-1"
          >
            CLOSE
          </button>
        </div>

        {/* Force summary table */}
        <div>
          <div className="hud-label mb-2">FORCE SUMMARY</div>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-1">FACTION</th>
                <th className="text-right">INITIAL</th>
                <th className="text-right">FINAL</th>
                <th className="text-right">CASUALTIES</th>
                <th className="text-right">KIA UNITS</th>
                <th className="text-right">REMAINING</th>
              </tr>
            </thead>
            <tbody>
              {report.factions.map(f => (
                <tr key={f.faction} className="border-b border-gray-800/50">
                  <td className="py-1.5 font-bold" style={{ color: factionColor(f.faction) }}>
                    {f.faction}
                  </td>
                  <td className="text-right text-gray-300">{f.initialStrength.toLocaleString()}</td>
                  <td className="text-right text-gray-300">{f.finalStrength.toLocaleString()}</td>
                  <td className="text-right text-red-400">-{f.casualties.toLocaleString()}</td>
                  <td className="text-right text-red-300">{f.unitsDestroyed}</td>
                  <td className="text-right text-green-400">{f.unitsRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-amber-400">{report.engagementCount}</div>
            <div className="text-[10px] text-gray-500 font-mono">ENGAGEMENTS</div>
          </div>
          <div className="bg-gray-800/50 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-cyan-400">{report.detectionCount}</div>
            <div className="text-[10px] text-gray-500 font-mono">DETECTIONS</div>
          </div>
          <div className="bg-gray-800/50 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-red-400">{report.escalationCount}</div>
            <div className="text-[10px] text-gray-500 font-mono">ESCALATIONS</div>
          </div>
        </div>

        {/* Casualty bars */}
        <div>
          <div className="hud-label mb-2">ATTRITION</div>
          {report.factions.map(f => {
            const pct = f.initialStrength > 0
              ? ((f.casualties / f.initialStrength) * 100)
              : 0
            return (
              <div key={f.faction} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono w-12" style={{ color: factionColor(f.faction) }}>
                  {f.faction}
                </span>
                <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: factionColor(f.faction),
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-12 text-right">
                  {pct.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>

        {/* Key events */}
        {report.keyEvents.length > 0 && (
          <div>
            <div className="hud-label mb-2">KEY EVENTS ({report.keyEvents.length})</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {report.keyEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] font-mono">
                  <span className="text-gray-600 w-12 shrink-0">T+{e.tick}h</span>
                  <span className={
                    e.severity === 'FLASH' ? 'text-red-400' :
                    e.severity === 'CRITICAL' ? 'text-amber-400' :
                    'text-gray-400'
                  }>
                    {e.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
