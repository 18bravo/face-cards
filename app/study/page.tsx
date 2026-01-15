import { prisma } from '@/lib/prisma'
import { QuizSession } from '@/components/QuizSession'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudyPage() {
  const leaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Face Cards
          </Link>
          <Link href="/about" className="text-sm text-gray-500 hover:text-gray-700">
            About
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {leaders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No leaders in database yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Run the data seed script to populate leaders.
            </p>
          </div>
        ) : (
          <QuizSession leaders={leaders} />
        )}
      </div>
    </main>
  )
}
