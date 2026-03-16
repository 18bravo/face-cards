'use client'

import { useState, useEffect } from 'react'

interface Article {
  id: string
  title: string
  url: string
  summary: string | null
  publishedAt: string | null
  feed: { name: string }
  militaryRelevance: number | null
  threatLevel: string
  region: string | null
  countries: string[]
}

interface FeedPanelProps {
  onGenerateScenario: (articleIds: string[], theater: string) => void
}

export default function FeedPanel({ onGenerateScenario }: FeedPanelProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [theater, setTheater] = useState('GLOBAL')
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all')

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    setLoading(true)
    try {
      const res = await fetch('/api/feeds/articles?limit=50')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function ingestFeeds() {
    setLoading(true)
    try {
      const res = await fetch('/api/feeds/ingest', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        console.log('Ingested:', data)
        await fetchArticles()
      }
    } catch (err) {
      console.error('Feed ingestion failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleArticle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredArticles = articles.filter(a => {
    if (filter === 'high') return (a.militaryRelevance ?? 0) >= 0.6
    if (filter === 'critical') return a.threatLevel === 'CRITICAL' || a.threatLevel === 'FLASH'
    return true
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="hud-label">Intelligence Feed</div>
          <button
            onClick={ingestFeeds}
            disabled={loading}
            className="text-[10px] font-mono px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-cyan-400 transition-colors"
          >
            {loading ? 'FETCHING...' : 'REFRESH FEEDS'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {(['all', 'high', 'critical'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                filter === f ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            {loading ? 'Loading feeds...' : 'No articles. Click REFRESH FEEDS to ingest.'}
          </div>
        ) : (
          filteredArticles.map(article => (
            <div
              key={article.id}
              onClick={() => toggleArticle(article.id)}
              className={`hud-panel p-2 cursor-pointer transition-colors ${
                selected.has(article.id) ? 'border-cyan-400/60' : 'hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(article.id)}
                  onChange={() => toggleArticle(article.id)}
                  className="mt-1 accent-cyan-400"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-tight truncate">
                    {article.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                    <span>{article.feed.name}</span>
                    {article.region && <span>&middot; {article.region}</span>}
                    {article.militaryRelevance != null && (
                      <span className={
                        article.militaryRelevance >= 0.7 ? 'text-red-400' :
                        article.militaryRelevance >= 0.4 ? 'text-amber-400' :
                        'text-gray-500'
                      }>
                        REL:{(article.militaryRelevance * 100).toFixed(0)}%
                      </span>
                    )}
                    {article.threatLevel !== 'INFO' && (
                      <span className={`font-bold ${
                        article.threatLevel === 'FLASH' ? 'text-red-400' :
                        article.threatLevel === 'CRITICAL' ? 'text-orange-400' :
                        'text-amber-400'
                      }`}>
                        {article.threatLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generate scenario */}
      {selected.size > 0 && (
        <div className="p-3 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={theater}
              onChange={e => setTheater(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-300"
            >
              <option value="GLOBAL">GLOBAL</option>
              <option value="INDOPACOM">INDOPACOM</option>
              <option value="EUCOM">EUCOM</option>
              <option value="CENTCOM">CENTCOM</option>
              <option value="AFRICOM">AFRICOM</option>
              <option value="SOUTHCOM">SOUTHCOM</option>
              <option value="NORTHCOM">NORTHCOM</option>
            </select>
          </div>
          <button
            onClick={() => onGenerateScenario(Array.from(selected), theater)}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded transition-colors"
          >
            GENERATE SCENARIO FROM {selected.size} ARTICLE{selected.size > 1 ? 'S' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
