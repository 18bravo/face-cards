'use client'

import { useState } from 'react'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: string
  branch: string | null
  organization: string
  isActive: boolean
}

interface LeaderTableProps {
  leaders: Leader[]
  onEdit: (leader: Leader) => void
  onDelete: (leader: Leader) => void
}

type SortKey = 'name' | 'title' | 'category' | 'branch'

export function LeaderTable({ leaders, onEdit, onDelete }: LeaderTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...leaders].sort((a, b) => {
    const aVal = a[sortKey] || ''
    const bVal = b[sortKey] || ''
    const cmp = aVal.localeCompare(bVal)
    return sortAsc ? cmp : -cmp
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const isActive = sortKey === sortKeyName
    return (
      <th
        className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
        onClick={() => handleSort(sortKeyName)}
      >
        {label} {isActive && (sortAsc ? '↑' : '↓')}
      </th>
    )
  }

  const fallbackUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=1e3a5f&color=fff`

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Photo</th>
            <SortHeader label="Name" sortKeyName="name" />
            <SortHeader label="Title" sortKeyName="title" />
            <SortHeader label="Category" sortKeyName="category" />
            <SortHeader label="Branch" sortKeyName="branch" />
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((leader) => (
            <tr
              key={leader.id}
              className={`border-b hover:bg-gray-50 ${!leader.isActive ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-3">
                <img
                  src={leader.photoUrl || fallbackUrl(leader.name)}
                  alt={leader.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = fallbackUrl(leader.name)
                  }}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {leader.name}
                {!leader.isActive && (
                  <span className="ml-2 text-xs text-red-500">(inactive)</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{leader.title}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {leader.category}
                </span>
              </td>
              <td className="px-4 py-3">
                {leader.branch && (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                    {leader.branch}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onEdit(leader)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(leader)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
