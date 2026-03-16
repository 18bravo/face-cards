/**
 * RSS Feed Ingestion & Scenario Generation
 *
 * Fetches RSS feeds from defense/geopolitical news sources,
 * extracts military-relevant information using AI, and generates
 * scenario seeds for MiroFish simulation.
 */

import { prisma } from './prisma'

interface RssItem {
  title: string
  link: string
  description?: string
  content?: string
  pubDate?: string
  author?: string
}

interface ParsedFeed {
  title: string
  items: RssItem[]
}

// ── Default Feed Sources ────────────────────────────────────

export const DEFAULT_FEEDS = [
  { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', category: 'DEFENSE' as const },
  { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', category: 'DEFENSE' as const },
  { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', category: 'GEOPOLITICS' as const },
  { name: 'The War Zone', url: 'https://www.twz.com/feed', category: 'DEFENSE' as const },
  { name: 'CSIS Analysis', url: 'https://www.csis.org/analysis/feed', category: 'GEOPOLITICS' as const },
  { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', category: 'GEOPOLITICS' as const },
  { name: 'CyberScoop', url: 'https://cyberscoop.com/feed/', category: 'CYBER' as const },
  { name: 'Janes', url: 'https://www.janes.com/feeds/news', category: 'INTELLIGENCE' as const },
] as const

// ── RSS Parser (lightweight, no external deps) ──────────────

function extractTagContent(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()

  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  return match ? match[1].trim().replace(/<[^>]*>/g, '') : ''
}

function parseRssXml(xml: string): ParsedFeed {
  const title = extractTagContent(xml, 'title')
  const items: RssItem[] = []

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    items.push({
      title: extractTagContent(itemXml, 'title'),
      link: extractTagContent(itemXml, 'link'),
      description: extractTagContent(itemXml, 'description') || undefined,
      content: extractTagContent(itemXml, 'content:encoded') || undefined,
      pubDate: extractTagContent(itemXml, 'pubDate') || undefined,
      author: extractTagContent(itemXml, 'author') || extractTagContent(itemXml, 'dc:creator') || undefined,
    })
  }

  return { title, items }
}

// ── Feed Fetching ───────────────────────────────────────────

export async function fetchFeed(url: string): Promise<ParsedFeed> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'EnderAI/1.0 (Operational Simulation Platform)' },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Feed fetch failed: ${response.status} ${url}`)
  }

  const xml = await response.text()
  return parseRssXml(xml)
}

/**
 * Fetch and store articles from all active feeds
 */
export async function ingestAllFeeds(): Promise<{ fetched: number; newArticles: number }> {
  const feeds = await prisma.rssFeed.findMany({ where: { isActive: true } })
  let totalNew = 0

  for (const feed of feeds) {
    try {
      const parsed = await fetchFeed(feed.url)

      for (const item of parsed.items) {
        if (!item.link) continue

        const existing = await prisma.feedArticle.findUnique({ where: { url: item.link } })
        if (existing) continue

        await prisma.feedArticle.create({
          data: {
            feedId: feed.id,
            title: item.title,
            url: item.link,
            summary: item.description?.slice(0, 1000),
            content: (item.content || item.description)?.slice(0, 5000),
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            author: item.author,
          },
        })
        totalNew++
      }

      await prisma.rssFeed.update({
        where: { id: feed.id },
        data: { lastFetched: new Date() },
      })
    } catch (error) {
      console.error(`[FEED_ERROR] ${feed.name}: ${error}`)
    }
  }

  return { fetched: feeds.length, newArticles: totalNew }
}

// ── AI Analysis ─────────────────────────────────────────────

/**
 * Analyze articles for military relevance and extract entities.
 * Uses OpenAI to score and extract structured data from news articles.
 */
export async function analyzeArticle(articleId: string): Promise<void> {
  const article = await prisma.feedArticle.findUnique({ where: { id: articleId } })
  if (!article) throw new Error(`Article not found: ${articleId}`)

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a military intelligence analyst. Analyze the following news article and extract structured data.

Return JSON with:
{
  "military_relevance": 0.0-1.0,
  "threat_level": "INFO" | "WARNING" | "CRITICAL" | "FLASH",
  "region": "region name or null",
  "countries": ["array", "of", "countries"],
  "entities": {
    "leaders": ["named leaders"],
    "military_units": ["identified units"],
    "weapons_systems": ["mentioned systems"],
    "locations": ["specific locations"],
    "organizations": ["orgs mentioned"]
  },
  "scenario_seed": "Brief description of a plausible future scenario based on this article (2-3 sentences)",
  "escalation_factors": ["factors that could escalate the situation"],
  "key_forces": {
    "faction_a": { "name": "...", "capabilities": "..." },
    "faction_b": { "name": "...", "capabilities": "..." }
  }
}`,
        },
        {
          role: 'user',
          content: `TITLE: ${article.title}\n\n${article.content || article.summary || 'No content available'}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI analysis failed: ${response.status}`)
  }

  const data = await response.json()
  const analysis = JSON.parse(data.choices[0].message.content)

  await prisma.feedArticle.update({
    where: { id: articleId },
    data: {
      militaryRelevance: analysis.military_relevance,
      threatLevel: analysis.threat_level,
      region: analysis.region,
      countries: analysis.countries || [],
      entities: analysis,
    },
  })
}

/**
 * Generate a scenario from a collection of related articles
 */
export async function generateScenarioFromArticles(
  articleIds: string[],
  theater: string
): Promise<string> {
  const articles = await prisma.feedArticle.findMany({
    where: { id: { in: articleIds } },
    include: { feed: true },
  })

  if (articles.length === 0) throw new Error('No articles found')

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

  const articleSummaries = articles.map((a: { feed: { name: string }; title: string; summary: string | null; militaryRelevance: number | null }) =>
    `[${a.feed.name}] ${a.title}\n${a.summary || ''}\nRelevance: ${a.militaryRelevance ?? 'unanalyzed'}`
  ).join('\n\n---\n\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a military scenario designer for an operational simulation platform. Based on current news articles, generate a realistic future military scenario for simulation.

Return JSON:
{
  "name": "Scenario name",
  "description": "Detailed scenario description (500+ words) including background, current situation, key actors, and potential flashpoints",
  "theater": "${theater}",
  "factions": [
    { "name": "...", "faction_code": "BLUE|RED|GREEN|NEUTRAL", "objectives": "...", "capabilities": "...", "disposition": "..." }
  ],
  "initial_units": [
    { "designation": "...", "unitType": "INFANTRY|ARMOR|NAVAL_SURFACE|etc", "branch": "ARMY|NAVY|etc", "echelon": "BRIGADE|DIVISION|etc", "faction": "BLUE|RED", "latitude": 0.0, "longitude": 0.0, "strength": 5000 }
  ],
  "key_events_to_model": ["event1", "event2"],
  "escalation_triggers": ["trigger1", "trigger2"],
  "simulation_objectives": "What should the simulation help us understand?"
}`,
        },
        {
          role: 'user',
          content: `Generate a future scenario based on these current events:\n\n${articleSummaries}`,
        },
      ],
    }),
  })

  if (!response.ok) throw new Error(`Scenario generation failed: ${response.status}`)

  const data = await response.json()
  const scenarioData = JSON.parse(data.choices[0].message.content)

  // Create the scenario in the database
  const scenario = await prisma.scenario.create({
    data: {
      name: scenarioData.name,
      description: scenarioData.description,
      theater: scenarioData.theater as 'INDOPACOM' | 'EUCOM' | 'CENTCOM' | 'AFRICOM' | 'SOUTHCOM' | 'NORTHCOM' | 'GLOBAL',
      status: 'DRAFT',
      sourceArticles: {
        create: articleIds.map(articleId => ({ articleId })),
      },
    },
  })

  // Create initial units from the generated scenario
  if (scenarioData.initial_units) {
    for (const unit of scenarioData.initial_units) {
      await prisma.militaryUnit.create({
        data: {
          name: unit.designation,
          designation: unit.designation,
          unitType: unit.unitType,
          branch: unit.branch,
          echelon: unit.echelon,
          strength: unit.strength || 1000,
          latitude: unit.latitude,
          longitude: unit.longitude,
          faction: unit.faction,
          scenarioId: scenario.id,
        },
      })
    }
  }

  return scenario.id
}
