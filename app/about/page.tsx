import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Face Cards
          </Link>
          <Link href="/study" className="text-sm text-blue-600 hover:text-blue-700">
            Study
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">About Face Cards</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Purpose</h2>
          <p className="text-gray-600">
            Face Cards helps government employees, military personnel, and
            contractors learn to recognize DoD senior leadership by sight.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Data Sources</h2>
          <ul className="text-gray-600 list-disc list-inside space-y-1">
            <li>Defense.gov official biographies</li>
            <li>Service branch official websites</li>
            <li>Pentagon Leadership directory</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Update Frequency</h2>
          <p className="text-gray-600">
            Key positions (SECDEF, CJCS, Service Chiefs) are checked daily.
            All other positions are verified weekly. Data is typically updated
            within one week of leadership changes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Privacy</h2>
          <p className="text-gray-600">
            Your study progress is stored locally in your browser. No personal
            data is collected or transmitted to any server.
          </p>
        </section>
      </div>
    </main>
  )
}
