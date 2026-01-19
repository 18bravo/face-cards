'use client'

import { useState, useEffect, useRef } from 'react'

interface DeleteDialogProps {
  leaderName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteDialog({ leaderName, onConfirm, onCancel }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
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

  // Focus cancel button on mount
  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 id="delete-dialog-title" className="text-xl font-bold mb-4">Delete Leader</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{leaderName}</strong>? This will
          mark them as inactive.
        </p>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
