import Link from 'next/link'
import AuthoritiesVisualization from '@/components/AuthoritiesVisualization'

export const metadata = {
  title: 'DoW Civilian Leadership Authorities | Face Cards',
  description: 'Explore the decision-making authorities of Department of War civilian leadership',
}

export default function AuthoritiesPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Face Cards
          </Link>
          <div className="flex gap-4">
            <Link href="/study" className="text-sm text-slate-300 hover:text-white">
              Study
            </Link>
            <Link href="/about" className="text-sm text-slate-300 hover:text-white">
              About
            </Link>
          </div>
        </div>
      </header>

      <AuthoritiesVisualization />
    </main>
  )
}
