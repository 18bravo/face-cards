'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LeaderTable } from '@/components/admin/LeaderTable'
import { LeaderForm } from '@/components/admin/LeaderForm'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { DiffModal } from '@/components/admin/DiffModal'
import { Leader, CATEGORIES, BRANCHES } from '@/types/admin'

interface DiffData {
  additions: Array<{ name: string; title: string; category: string; branch: string | null }>
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
  previewToken: string
}

// Filter options with 'All' option
const CATEGORY_OPTIONS = [{ value: '', label: 'All Categories' }, ...CATEGORIES]
const BRANCH_OPTIONS = [{ value: '', label: 'All Branches' }, ...BRANCHES]

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AdminPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [branch, setBranch] = useState('')
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)

  const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingLeader, setDeletingLeader] = useState<Leader | null>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [diffData, setDiffData] = useState<DiffData | null>(null)

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300)

  const fetchLeaders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (branch) params.set('branch', branch)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (includeInactive) params.set('includeInactive', 'true')

    const res = await fetch(`/api/admin/leaders?${params}`)
    const data = await res.json()
    setLeaders(data)
    setLoading(false)
  }, [category, branch, debouncedSearch, includeInactive])

  useEffect(() => {
    fetchLeaders()
  }, [fetchLeaders])

  async function handleSaveLeader(data: Partial<Leader>) {
    const isEdit = editingLeader !== null
    const url = isEdit
      ? `/api/admin/leaders/${editingLeader.id}`
      : '/api/admin/leaders'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Save failed')

    setEditingLeader(null)
    setShowAddForm(false)
    fetchLeaders()
  }

  async function handleDeleteLeader() {
    if (!deletingLeader) return

    const res = await fetch(`/api/admin/leaders/${deletingLeader.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Delete failed')

    setDeletingLeader(null)
    fetchLeaders()
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/preview-refresh', { method: 'POST' })
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      setDiffData(data)
    } catch (error) {
      console.error('Refresh error:', error)
      alert('Failed to fetch updates')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleApplyDiff(token: string) {
    const res = await fetch('/api/admin/apply-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewToken: token }),
    })

    if (!res.ok) throw new Error('Apply failed')

    setDiffData(null)
    fetchLeaders()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Leader
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? 'Fetching...' : 'Refresh from AI'}
        </button>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {BRANCH_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span className="text-sm">Show inactive</span>
        </label>
      </div>

      {/* Leader Table */}
      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading...</p>
      ) : (
        <LeaderTable
          leaders={leaders}
          onEdit={setEditingLeader}
          onDelete={setDeletingLeader}
        />
      )}

      {/* Modals */}
      {(showAddForm || editingLeader) && (
        <LeaderForm
          leader={editingLeader}
          onSave={handleSaveLeader}
          onCancel={() => {
            setShowAddForm(false)
            setEditingLeader(null)
          }}
        />
      )}

      {deletingLeader && (
        <DeleteDialog
          leaderName={deletingLeader.name}
          onConfirm={handleDeleteLeader}
          onCancel={() => setDeletingLeader(null)}
        />
      )}

      {diffData && (
        <DiffModal
          diff={diffData}
          onApply={handleApplyDiff}
          onCancel={() => setDiffData(null)}
        />
      )}
    </div>
  )
}
