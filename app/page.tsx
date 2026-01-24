import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center max-w-md space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Face Cards</h1>
        <p className="text-lg text-gray-600">
          Learn the faces and names of DoD senior leadership. Quiz yourself with
          flashcards featuring military and civilian leaders.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/study"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Start Studying
          </Link>
          <Link
            href="/authorities"
            className="inline-block px-8 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Explore Leadership Authorities
          </Link>
          <Link
            href="/3d"
            className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-500 transition-colors"
          >
            3D Defense Enterprise
          </Link>
          <Link
            href="/landing"
            className="inline-block px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            View Cinematic Landing
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          Data updated daily from official DoD sources
        </p>
      </div>
    </main>
  )
}
