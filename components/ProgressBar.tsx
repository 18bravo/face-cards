interface ProgressBarProps {
  current: number
  total: number
  correct: number
}

export function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const accuracy = current > 0 ? Math.round((correct / current) * 100) : 0

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {current} / {total}
        </span>
        <span>{accuracy}% correct</span>
      </div>
    </div>
  )
}
