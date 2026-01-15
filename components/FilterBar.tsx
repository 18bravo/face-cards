'use client'

import { Category, Branch } from '@prisma/client'

interface FilterBarProps {
  category: Category | ''
  branch: Branch | ''
  onCategoryChange: (category: Category | '') => void
  onBranchChange: (branch: Branch | '') => void
  cardCount: number
  totalCount: number
}

const categoryLabels: Record<Category, string> = {
  MILITARY_4STAR: '4-Star Military',
  MILITARY_3STAR: '3-Star Military',
  MAJOR_COMMAND: 'Major Command',
  SERVICE_SECRETARY: 'Service Secretary',
  CIVILIAN_SES: 'Civilian SES',
  APPOINTEE: 'Appointee',
  SECRETARIAT: 'Secretariat',
}

const branchLabels: Record<Branch, string> = {
  ARMY: 'Army',
  NAVY: 'Navy',
  AIR_FORCE: 'Air Force',
  MARINE_CORPS: 'Marine Corps',
  SPACE_FORCE: 'Space Force',
  COAST_GUARD: 'Coast Guard',
}

export function FilterBar({
  category,
  branch,
  onCategoryChange,
  onBranchChange,
  cardCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category | '')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value as Branch | '')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="">All Branches</option>
          {Object.entries(branchLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-center text-sm text-gray-500">
        {cardCount} of {totalCount} cards
      </p>
    </div>
  )
}
