'use client'

import { useState, useEffect, useMemo } from 'react'
import { Category, Branch } from '@prisma/client'
import { Card } from './Card'
import { FilterBar } from './FilterBar'
import { ProgressBar } from './ProgressBar'
import { recordAnswer, getWeakCards } from '@/lib/storage'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: Category
  branch: Branch | null
  organization: string
}

interface QuizSessionProps {
  leaders: Leader[]
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function QuizSession({ leaders }: QuizSessionProps) {
  const [category, setCategory] = useState<Category | ''>('')
  const [branch, setBranch] = useState<Branch | ''>('')
  const [showWeakOnly, setShowWeakOnly] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [missedCards, setMissedCards] = useState<Leader[]>([])

  const filteredLeaders = useMemo(() => {
    let filtered = leaders

    if (category) {
      filtered = filtered.filter((l) => l.category === category)
    }
    if (branch) {
      filtered = filtered.filter((l) => l.branch === branch)
    }
    if (showWeakOnly) {
      const weakIds = getWeakCards(filtered.map((l) => l.id))
      filtered = filtered.filter((l) => weakIds.includes(l.id))
    }

    return shuffleArray(filtered)
  }, [leaders, category, branch, showWeakOnly])

  const currentCard = filteredLeaders[currentIndex]

  const handleAnswer = (wasCorrect: boolean) => {
    if (!currentCard) return

    recordAnswer(currentCard.id, wasCorrect)
    setAnswered((a) => a + 1)

    if (wasCorrect) {
      setCorrect((c) => c + 1)
    } else {
      setMissedCards((m) => [...m, currentCard])
    }

    if (currentIndex < filteredLeaders.length - 1) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    } else {
      setSessionComplete(true)
    }
  }

  const resetSession = (reviewMissed = false) => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCorrect(0)
    setAnswered(0)
    setSessionComplete(false)
    if (!reviewMissed) {
      setMissedCards([])
    }
  }

  if (filteredLeaders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cards match your filters.</p>
        <button
          onClick={() => {
            setCategory('')
            setBranch('')
            setShowWeakOnly(false)
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  if (sessionComplete) {
    const percentage = Math.round((correct / answered) * 100)
    return (
      <div className="text-center py-12 space-y-6">
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <p className="text-4xl font-bold text-blue-600">{percentage}%</p>
        <p className="text-gray-600">
          {correct} of {answered} correct
        </p>
        <div className="flex gap-4 justify-center">
          {missedCards.length > 0 && (
            <button
              onClick={() => resetSession(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium"
            >
              Review Missed ({missedCards.length})
            </button>
          )}
          <button
            onClick={() => resetSession(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <FilterBar
        category={category}
        branch={branch}
        onCategoryChange={(c) => {
          setCategory(c)
          resetSession()
        }}
        onBranchChange={(b) => {
          setBranch(b)
          resetSession()
        }}
        cardCount={filteredLeaders.length}
        totalCount={leaders.length}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showWeakOnly}
          onChange={(e) => {
            setShowWeakOnly(e.target.checked)
            resetSession()
          }}
          className="rounded"
        />
        Show weak cards only
      </label>

      <ProgressBar
        current={answered}
        total={filteredLeaders.length}
        correct={correct}
      />

      {currentCard && (
        <>
          <Card
            photoUrl={currentCard.photoUrl}
            title={currentCard.title}
            name={currentCard.name}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {isFlipped && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(false)}
                className="px-8 py-3 bg-red-500 text-white rounded-lg font-medium text-lg"
              >
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium text-lg"
              >
                Correct
              </button>
            </div>
          )}

          {!isFlipped && (
            <button
              onClick={() => setIsFlipped(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg"
            >
              Flip Card
            </button>
          )}
        </>
      )}
    </div>
  )
}
