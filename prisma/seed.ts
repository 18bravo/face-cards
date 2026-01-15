import { PrismaClient } from '@prisma/client'
import { fetchAllLeaders } from '../lib/openai'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching leader data from OpenAI...')
  const leaders = await fetchAllLeaders()

  console.log(`Found ${leaders.length} leaders. Seeding database...`)

  for (const leader of leaders) {
    await prisma.leader.upsert({
      where: {
        id: `${leader.title}-${leader.organization}`.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {
        name: leader.name,
        photoUrl: leader.photoUrl,
        lastVerified: new Date(),
      },
      create: {
        id: `${leader.title}-${leader.organization}`.toLowerCase().replace(/\s+/g, '-'),
        name: leader.name,
        title: leader.title,
        photoUrl: leader.photoUrl,
        category: leader.category,
        branch: leader.branch,
        organization: leader.organization,
      },
    })
    console.log(`  ✓ ${leader.name} - ${leader.title}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
