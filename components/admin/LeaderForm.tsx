'use client'

import { useState, useEffect } from 'react'

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

interface LeaderFormProps {
  leader: Leader | null
  onSave: (data: Partial<Leader>) => Promise<void>
  onCancel: () => void
}

const CATEGORIES = [
  'MILITARY_4STAR',
  'MILITARY_3STAR',
  'MAJOR_COMMAND',
  'SERVICE_SECRETARY',
  'CIVILIAN_SES',
  'APPOINTEE',
  'SECRETARIAT',
]

const BRANCHES = [
  'ARMY',
  'NAVY',
  'AIR_FORCE',
  'MARINE_CORPS',
  'SPACE_FORCE',
  'COAST_GUARD',
]

export function LeaderForm({ leader, onSave, onCancel }: LeaderFormProps) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [branch, setBranch] = useState<string>('')
  const [organization, setOrganization] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        branch: branch || null,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          {leader ? 'Edit Leader' : 'Add Leader'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input
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
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
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
