'use client'

import { useState, useEffect, useRef } from 'react'
import { Leader, CATEGORIES, BRANCHES, Category, Branch } from '@/types/admin'

interface LeaderFormProps {
  leader: Leader | null
  onSave: (data: Partial<Leader>) => Promise<void>
  onCancel: () => void
}

export function LeaderForm({ leader, onSave, onCancel }: LeaderFormProps) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [category, setCategory] = useState<Category>(CATEGORIES[0].value)
  const [branch, setBranch] = useState<Branch | ''>('')
  const [organization, setOrganization] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (leader) {
      setName(leader.name)
      setTitle(leader.title)
      setPhotoUrl(leader.photoUrl)
      setCategory(leader.category)
      setBranch(leader.branch || '')
      setOrganization(leader.organization)
      setIsActive(leader.isActive)
    }
  }, [leader])

  // Handle escape key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // Focus trap and initial focus
  useEffect(() => {
    const firstInput = dialogRef.current?.querySelector('input')
    firstInput?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        name,
        title,
        photoUrl,
        category,
        branch: branch === '' ? null : branch,
        organization,
        isActive,
      })
    } catch {
      setError('Failed to save leader')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leader-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div ref={dialogRef} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 id="leader-form-title" className="text-xl font-bold mb-4">
          {leader ? 'Edit Leader' : 'Add Leader'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leader-name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="leader-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="leader-title" className="block text-sm font-medium mb-1">Title</label>
            <input
              id="leader-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="leader-photo" className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              id="leader-photo"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="leader-category" className="block text-sm font-medium mb-1">Category</label>
              <select
                id="leader-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full p-2 border rounded"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="leader-branch" className="block text-sm font-medium mb-1">Branch</label>
              <select
                id="leader-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch | '')}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="leader-org" className="block text-sm font-medium mb-1">Organization</label>
            <input
              id="leader-org"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {leader && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="leader-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="leader-active" className="text-sm">Active</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
