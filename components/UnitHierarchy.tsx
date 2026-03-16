'use client'

import { useMemo, useState } from 'react'
import type { UnitMarker } from '@/types/military'
import { FACTION_COLORS, UNIT_TYPE_ICONS } from '@/types/military'

interface Props {
  units: UnitMarker[]
  onUnitSelect: (unit: UnitMarker) => void
}

// Echelon rank for sorting (higher = larger formation)
const ECHELON_RANK: Record<string, number> = {
  ARMY_LEVEL: 7,
  CORPS: 6,
  FLEET: 6,
  DIVISION: 5,
  BRIGADE: 4,
  WING: 4,
  REGIMENT: 3,
  BATTALION: 2,
  SQUADRON: 2,
  COMPANY: 1,
  PLATOON: 0,
}

interface TreeNode {
  unit: UnitMarker
  children: TreeNode[]
}

function buildHierarchy(units: UnitMarker[]): Map<string, TreeNode[]> {
  const factions = new Map<string, TreeNode[]>()

  // Group by faction
  const byFaction = new Map<string, UnitMarker[]>()
  for (const u of units) {
    const list = byFaction.get(u.faction) ?? []
    list.push(u)
    byFaction.set(u.faction, list)
  }

  for (const [faction, factionUnits] of byFaction) {
    // Sort by echelon rank descending
    const sorted = [...factionUnits].sort((a, b) =>
      (ECHELON_RANK[b.echelon] ?? 0) - (ECHELON_RANK[a.echelon] ?? 0)
    )

    // Build tree: top echelon units are roots, lower echelon are children of nearest higher unit
    const roots: TreeNode[] = []
    const nodes = new Map<string, TreeNode>()

    for (const unit of sorted) {
      const node: TreeNode = { unit, children: [] }
      nodes.set(unit.id, node)

      // Find a parent: nearest higher-echelon unit of same faction
      const myRank = ECHELON_RANK[unit.echelon] ?? 0
      let parent: TreeNode | null = null

      for (const root of roots) {
        const candidate = findParentInTree(root, myRank)
        if (candidate) { parent = candidate; break }
      }

      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }

    factions.set(faction, roots)
  }

  return factions
}

function findParentInTree(node: TreeNode, childRank: number): TreeNode | null {
  const nodeRank = ECHELON_RANK[node.unit.echelon] ?? 0
  if (nodeRank > childRank) {
    // Check children first for more specific parent
    for (const child of node.children) {
      const deeper = findParentInTree(child, childRank)
      if (deeper) return deeper
    }
    return node
  }
  return null
}

function TreeNodeRow({ node, depth, onSelect }: { node: TreeNode; depth: number; onSelect: (u: UnitMarker) => void }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const u = node.unit
  const color = FACTION_COLORS[u.faction as keyof typeof FACTION_COLORS] ?? '#888'
  const icon = UNIT_TYPE_ICONS[u.unitType] ?? '?'
  const isDestroyed = u.status === 'DESTROYED'

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-gray-800/60 ${isDestroyed ? 'opacity-40' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => onSelect(u)}
      >
        {node.children.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="text-gray-600 text-[10px] w-3 text-center"
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-3" />
        )}

        <span className="text-[11px]" style={{ color }}>{icon}</span>
        <span className="text-[10px] font-mono truncate" style={{ color }}>
          {u.designation}
        </span>
        <span className="text-[9px] text-gray-600 font-mono ml-auto shrink-0">
          {u.echelon}
        </span>
        <span className={`text-[9px] font-mono w-8 text-right shrink-0 ${
          u.status === 'ENGAGED' ? 'text-red-400' :
          u.status === 'MOVING' ? 'text-amber-400' :
          u.status === 'DESTROYED' ? 'text-gray-600 line-through' :
          'text-green-400'
        }`}>
          {isDestroyed ? 'KIA' : `${(u.readiness * 100).toFixed(0)}%`}
        </span>
      </div>
      {expanded && node.children.map(child => (
        <TreeNodeRow key={child.unit.id} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default function UnitHierarchy({ units, onUnitSelect }: Props) {
  const hierarchy = useMemo(() => buildHierarchy(units), [units])

  const factionOrder = ['BLUE', 'GREEN', 'RED', 'NEUTRAL']
  const sortedFactions = [...hierarchy.entries()].sort(
    (a, b) => factionOrder.indexOf(a[0]) - factionOrder.indexOf(b[0])
  )

  return (
    <div className="space-y-2">
      {sortedFactions.map(([faction, roots]) => (
        <div key={faction}>
          <div
            className="text-[10px] font-mono font-bold px-2 py-1 border-b border-gray-800"
            style={{ color: FACTION_COLORS[faction as keyof typeof FACTION_COLORS] ?? '#888' }}
          >
            {faction} FORCES ({roots.reduce((c, r) => c + countNodes(r), 0)} units)
          </div>
          {roots.map(root => (
            <TreeNodeRow key={root.unit.id} node={root} depth={0} onSelect={onUnitSelect} />
          ))}
        </div>
      ))}
    </div>
  )
}

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0)
}
