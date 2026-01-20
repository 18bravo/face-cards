'use client'

import { Category, Branch } from '@prisma/client'

interface FilterBarProps {
  categories: Category[]
  branch: Branch | ''
  onCategoriesChange: (categories: Category[]) => void
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

const allCategories = Object.keys(categoryLabels) as Category[]

export function FilterBar({
  categories,
  branch,
  onCategoriesChange,
  onBranchChange,
  cardCount,
  totalCount,
}: FilterBarProps) {
  const toggleCategory = (cat: Category) => {
    if (categories.includes(cat)) {
      onCategoriesChange(categories.filter((c) => c !== cat))
    } else {
      onCategoriesChange([...categories, cat])
    }
  }

  const selectAll = () => onCategoriesChange(allCategories)
  const selectNone = () => onCategoriesChange([])

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Category checkboxes */}
      <div className="bg-white border border-gray-300 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Categories</span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-blue-600 hover:text-blue-800"
            >
              All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={selectNone}
              className="text-blue-600 hover:text-blue-800"
            >
              None
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {allCategories.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-gray-300"
              />
              <span className="truncate">{categoryLabels[cat]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Branch dropdown */}
      <select
        value={branch}
        onChange={(e) => onBranchChange(e.target.value as Branch | '')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
      >
        <option value="">All Branches</option>
        {Object.entries(branchLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <p className="text-center text-sm text-gray-500">
        {cardCount} of {totalCount} cards
      </p>
    </div>
  )
}
