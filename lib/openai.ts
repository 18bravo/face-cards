import OpenAI from 'openai'
import { Category, Branch } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface LeaderData {
  name: string
  title: string
  photoUrl: string
  category: Category
  branch: Branch | null
  organization: string
}

export async function fetchLeaderData(position: string): Promise<LeaderData | null> {
  const prompt = `You are a research assistant finding information about US Department of Defense leadership.

Find the CURRENT holder of this position: "${position}"

Return a JSON object with these exact fields:
- name: Full name with rank/title (e.g., "General John Smith")
- title: Official position title
- photoUrl: URL to their official photo from defense.gov or service branch website
- category: One of: MILITARY_4STAR, MILITARY_3STAR, MAJOR_COMMAND, SERVICE_SECRETARY, CIVILIAN_SES, APPOINTEE, SECRETARIAT
- branch: One of: ARMY, NAVY, AIR_FORCE, MARINE_CORPS, SPACE_FORCE, COAST_GUARD (or null for civilians)
- organization: The organization they lead (e.g., "Joint Chiefs of Staff", "U.S. Army")

Only return the JSON object, no other text. If you cannot find current information, return null.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const data = JSON.parse(content)
    if (!data.name || !data.title || !data.photoUrl) return null

    return data as LeaderData
  } catch (error) {
    console.error('Error fetching leader data:', error)
    return null
  }
}

export async function fetchAllLeaders(): Promise<LeaderData[]> {
  const positions = [
    // Key Civilian Leadership
    'Secretary of Defense',
    'Deputy Secretary of Defense',
    'Secretary of the Army',
    'Secretary of the Navy',
    'Secretary of the Air Force',

    // Joint Chiefs
    'Chairman of the Joint Chiefs of Staff',
    'Vice Chairman of the Joint Chiefs of Staff',
    'Chief of Staff of the Army',
    'Chief of Naval Operations',
    'Chief of Staff of the Air Force',
    'Commandant of the Marine Corps',
    'Chief of Space Operations',
    'Chief of the National Guard Bureau',

    // Combatant Commands
    'Commander, U.S. Indo-Pacific Command',
    'Commander, U.S. European Command',
    'Commander, U.S. Central Command',
    'Commander, U.S. Africa Command',
    'Commander, U.S. Northern Command',
    'Commander, U.S. Southern Command',
    'Commander, U.S. Space Command',
    'Commander, U.S. Cyber Command',
    'Commander, U.S. Special Operations Command',
    'Commander, U.S. Strategic Command',
    'Commander, U.S. Transportation Command',

    // Service Vice Chiefs
    'Vice Chief of Staff of the Army',
    'Vice Chief of Naval Operations',
    'Vice Chief of Staff of the Air Force',
    'Assistant Commandant of the Marine Corps',
    'Vice Chief of Space Operations',
  ]

  const leaders: LeaderData[] = []

  for (const position of positions) {
    const data = await fetchLeaderData(position)
    if (data) {
      leaders.push(data)
    }
    // Rate limiting - wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return leaders
}
