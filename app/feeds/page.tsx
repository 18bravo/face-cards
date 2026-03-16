'use client'

import { useRouter } from 'next/navigation'
import FeedPanel from '@/components/FeedPanel'
import Link from 'next/link'

export default function FeedsPage() {
  const router = useRouter()

  async function handleGenerateScenario(articleIds: string[], theater: string) {
    try {
      const res = await fetch('/api/feeds/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds, theater }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/globe?scenario=${data.scenarioId}`)
      } else {
        console.error('Scenario generation failed')
      }
    } catch (err) {
      console.error('Error generating scenario:', err)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top bar */}
      <header className="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950/95">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-sm">
            <span className="text-white">Ender</span>
            <span className="text-cyan-400">AI</span>
          </Link>
          <div className="h-4 w-px bg-gray-800" />
          <span className="text-xs font-mono text-gray-400">INTELLIGENCE FEEDS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/globe" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            GLOBE
          </Link>
          <Link href="/simulation" className="text-[10px] font-mono text-gray-400 hover:text-cyan-400">
            SCENARIOS
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Feed panel */}
        <div className="w-96 border-r border-gray-800 overflow-hidden">
          <FeedPanel onGenerateScenario={handleGenerateScenario} />
        </div>

        {/* Main content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Intelligence Feed Manager</h1>
            <p className="text-gray-400 text-sm">
              RSS feeds from defense and geopolitical news sources are ingested,
              analyzed for military relevance using AI, and used to generate
              realistic future scenarios for MiroFish simulation.
            </p>

            {/* Default feeds info */}
            <div className="hud-panel p-4 space-y-3">
              <div className="hud-label">Configured Feed Sources</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Defense News', cat: 'DEFENSE' },
                  { name: 'Breaking Defense', cat: 'DEFENSE' },
                  { name: 'War on the Rocks', cat: 'GEOPOLITICS' },
                  { name: 'The War Zone', cat: 'DEFENSE' },
                  { name: 'CSIS Analysis', cat: 'GEOPOLITICS' },
                  { name: 'Reuters World', cat: 'GEOPOLITICS' },
                  { name: 'CyberScoop', cat: 'CYBER' },
                  { name: 'Janes', cat: 'INTELLIGENCE' },
                ].map(feed => (
                  <div key={feed.name} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      feed.cat === 'DEFENSE' ? 'bg-blue-400' :
                      feed.cat === 'GEOPOLITICS' ? 'bg-amber-400' :
                      feed.cat === 'CYBER' ? 'bg-purple-400' :
                      'bg-green-400'
                    }`} />
                    <span className="text-gray-300">{feed.name}</span>
                    <span className="text-gray-600 text-[10px]">{feed.cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow */}
            <div className="hud-panel p-4 space-y-3">
              <div className="hud-label">Workflow</div>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex gap-3">
                  <span className="text-cyan-400 font-mono w-6">01</span>
                  <span>RSS feeds are fetched and articles stored in the database</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400 font-mono w-6">02</span>
                  <span>AI analyzes each article for military relevance, threat level, entities</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400 font-mono w-6">03</span>
                  <span>Select related articles and choose a theater of operations</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400 font-mono w-6">04</span>
                  <span>AI generates a detailed scenario with unit dispositions and objectives</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-cyan-400 font-mono w-6">05</span>
                  <span>Scenario seeds MiroFish swarm simulation for campaign modeling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
