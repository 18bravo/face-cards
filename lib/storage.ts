export interface CardStats {
  timesSeen: number
  timesCorrect: number
}

export interface StoredProgress {
  cardStats: Record<string, CardStats>
  lastStudied: string
}

const STORAGE_KEY = 'face-cards-progress'

export function getProgress(): StoredProgress {
  if (typeof window === 'undefined') {
    return { cardStats: {}, lastStudied: '' }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { cardStats: {}, lastStudied: '' }
  }

  try {
    return JSON.parse(stored)
  } catch {
    return { cardStats: {}, lastStudied: '' }
  }
}

export function saveProgress(progress: StoredProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function recordAnswer(cardId: string, correct: boolean): void {
  const progress = getProgress()

  if (!progress.cardStats[cardId]) {
    progress.cardStats[cardId] = { timesSeen: 0, timesCorrect: 0 }
  }

  progress.cardStats[cardId].timesSeen++
  if (correct) {
    progress.cardStats[cardId].timesCorrect++
  }

  progress.lastStudied = new Date().toISOString()
  saveProgress(progress)
}

export function getWeakCards(cardIds: string[]): string[] {
  const progress = getProgress()

  return cardIds.filter((id) => {
    const stats = progress.cardStats[id]
    if (!stats || stats.timesSeen < 2) return false
    const accuracy = stats.timesCorrect / stats.timesSeen
    return accuracy < 0.7
  })
}
