'use client'

import { useState, useEffect } from 'react'

interface LeaderDiff {
  name: string
  title: string
  category: string
  branch: string | null
}

interface DiffData {
  additions: LeaderDiff[]
  updates: Array<{
    id: string
    name: string
    changes: Array<{ field: string; current: string; proposed: string }>
  }>
  removals: Array<{ id: string; name: string; title: string }>
  previewToken: string
}

interface DiffModalProps {
  diff: DiffData
  onApply: (token: string) => Promise<void>
  onCancel: () => void
}

export function DiffModal({ diff, onApply, onCancel }: DiffModalProps) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  const totalChanges =
    diff.additions.length + diff.updates.length + diff.removals.length

  async function handleApply() {
    setApplying(true)
    setError('')
    try {
      await onApply(diff.previewToken)
    } catch {
      setError('Failed to apply changes')
      setApplying(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 id="diff-modal-title" className="text-xl font-bold">Review AI Changes</h2>
          <p className="text-gray-600 mt-1">
            Found {diff.additions.length} additions, {diff.updates.length} updates,{' '}
            {diff.removals.length} removals
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
          )}

          {totalChanges === 0 && (
            <p className="text-gray-500 text-center py-8">
              No changes detected. Data is up to date.
            </p>
          )}

          {diff.additions.length > 0 && (
            <section>
              <h3 className="font-semibold text-green-700 mb-3">
                New Leaders ({diff.additions.length})
              </h3>
              <div className="space-y-2">
                {diff.additions.map((leader, i) => (
                  <div
                    key={i}
                    className="bg-green-50 border border-green-200 rounded p-3"
                  >
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-gray-600">{leader.title}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {diff.updates.length > 0 && (
            <section>
              <h3 className="font-semibold text-yellow-700 mb-3">
                Updated Leaders ({diff.updates.length})
              </h3>
              <div className="space-y-2">
                {diff.updates.map((update) => (
                  <div
                    key={update.id}
                    className="bg-yellow-50 border border-yellow-200 rounded p-3"
                  >
                    <p className="font-medium mb-2">{update.name}</p>
                    {update.changes.map((change, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-500">{change.field}:</span>{' '}
                        <span className="line-through text-red-600">
                          {change.current}
                        </span>{' '}
                        →{' '}
                        <span className="text-green-600">{change.proposed}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {diff.removals.length > 0 && (
            <section>
              <h3 className="font-semibold text-red-700 mb-3">
                Removed Leaders ({diff.removals.length})
              </h3>
              <div className="space-y-2">
                {diff.removals.map((leader) => (
                  <div
                    key={leader.id}
                    className="bg-red-50 border border-red-200 rounded p-3"
                  >
                    <p className="font-medium">{leader.name}</p>
                    <p className="text-sm text-gray-600">{leader.title}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          {totalChanges > 0 && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply All Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
