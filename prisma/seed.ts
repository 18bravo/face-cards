import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding EnderAI database...')

  // ── Create default RSS feeds ──────────────────────────────
  const feeds = [
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', category: 'DEFENSE' as const },
    { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', category: 'DEFENSE' as const },
    { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', category: 'GEOPOLITICS' as const },
    { name: 'The War Zone', url: 'https://www.twz.com/feed', category: 'DEFENSE' as const },
    { name: 'CSIS Analysis', url: 'https://www.csis.org/analysis/feed', category: 'GEOPOLITICS' as const },
    { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', category: 'GEOPOLITICS' as const },
    { name: 'CyberScoop', url: 'https://cyberscoop.com/feed/', category: 'CYBER' as const },
  ]

  for (const feed of feeds) {
    await prisma.rssFeed.upsert({
      where: { url: feed.url },
      update: {},
      create: feed,
    })
  }
  console.log(`  Created ${feeds.length} RSS feeds`)

  // ── Create INDOPACOM demo scenario ────────────────────────
  const scenario = await prisma.scenario.create({
    data: {
      name: 'Western Pacific Contingency',
      description: `A major military contingency scenario in the Western Pacific theater involving potential conflict over Taiwan.

Blue forces (US and allied) must establish maritime superiority and defend allied positions while Red forces (PLA) conduct amphibious operations and area denial. Green forces (ROC) defend the island.

This scenario models the initial 72-hour phase of a potential conflict, including:
- PLA air and missile strikes on Taiwan defense infrastructure
- US carrier strike group repositioning from Japan
- JGSDF activation of southwestern island defense
- Submarine warfare in the Philippine Sea
- Cyber operations against C4ISR systems`,
      theater: 'INDOPACOM',
      status: 'DRAFT',
    },
  })

  // ── BLUE forces (US + Japan) ──────────────────────────────
  const blueUnits = [
    {
      name: 'Seventh Fleet', designation: '7th Fleet',
      unitType: 'CARRIER_GROUP' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 15000, latitude: 35.3, longitude: 139.7, faction: 'BLUE',
    },
    {
      name: 'III Marine Expeditionary Force', designation: 'III MEF',
      unitType: 'AMPHIBIOUS' as const, branch: 'MARINE_CORPS' as const, echelon: 'CORPS' as const,
      strength: 20000, latitude: 26.5, longitude: 127.8, faction: 'BLUE',
    },
    {
      name: '2nd Infantry Division', designation: '2nd ID',
      unitType: 'INFANTRY' as const, branch: 'ARMY' as const, echelon: 'DIVISION' as const,
      strength: 17000, latitude: 37.8, longitude: 127.0, faction: 'BLUE',
    },
    {
      name: 'Gerald R. Ford Carrier Strike Group', designation: 'CVN-78 CSG',
      unitType: 'CARRIER_GROUP' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 7500, latitude: 22.0, longitude: 135.0, faction: 'BLUE',
      speed: 28,
    },
    {
      name: 'Japan Ground Self-Defense Force Western Army', designation: 'JGSDF Western Army',
      unitType: 'INFANTRY' as const, branch: 'ARMY' as const, echelon: 'ARMY_LEVEL' as const,
      strength: 30000, latitude: 33.6, longitude: 131.2, faction: 'BLUE',
    },
    {
      name: '5th Air Force', designation: '5th AF',
      unitType: 'AIR_FIGHTER' as const, branch: 'AIR_FORCE' as const, echelon: 'WING' as const,
      strength: 8000, latitude: 35.7, longitude: 139.3, faction: 'BLUE',
    },
    {
      name: 'Submarine Force Pacific Detachment', designation: 'SUBPAC Det',
      unitType: 'NAVAL_SUBSURFACE' as const, branch: 'NAVY' as const, echelon: 'SQUADRON' as const,
      strength: 2000, latitude: 24.0, longitude: 130.0, faction: 'BLUE',
    },
  ]

  // ── RED forces (PLA) ──────────────────────────────────────
  const redUnits = [
    {
      name: 'PLA 73rd Group Army', designation: '73rd Group Army',
      unitType: 'ARMOR' as const, branch: 'ARMY' as const, echelon: 'CORPS' as const,
      strength: 45000, latitude: 26.1, longitude: 119.3, faction: 'RED',
    },
    {
      name: 'PLA Eastern Theater Navy', designation: 'ET Navy',
      unitType: 'NAVAL_SURFACE' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 25000, latitude: 30.2, longitude: 122.1, faction: 'RED',
    },
    {
      name: 'PLA Rocket Force East', designation: 'PLARF East',
      unitType: 'MISSILE' as const, branch: 'ARMY' as const, echelon: 'BRIGADE' as const,
      strength: 8000, latitude: 27.0, longitude: 117.0, faction: 'RED',
    },
    {
      name: 'PLA Air Force Eastern Theater', designation: 'PLAAF ET',
      unitType: 'AIR_FIGHTER' as const, branch: 'AIR_FORCE' as const, echelon: 'WING' as const,
      strength: 12000, latitude: 28.5, longitude: 118.5, faction: 'RED',
    },
    {
      name: 'PLA 71st Group Army', designation: '71st Group Army',
      unitType: 'INFANTRY' as const, branch: 'ARMY' as const, echelon: 'CORPS' as const,
      strength: 40000, latitude: 32.0, longitude: 118.8, faction: 'RED',
    },
    {
      name: 'PLA Strategic Support Force', designation: 'SSF Cyber',
      unitType: 'CYBER' as const, branch: 'SPACE_FORCE' as const, echelon: 'BRIGADE' as const,
      strength: 5000, latitude: 39.9, longitude: 116.4, faction: 'RED',
    },
    {
      name: 'PLA Southern Theater Navy', designation: 'ST Navy',
      unitType: 'NAVAL_SURFACE' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 18000, latitude: 18.2, longitude: 109.5, faction: 'RED',
    },
  ]

  // ── GREEN forces (Taiwan / ROC) ───────────────────────────
  const greenUnits = [
    {
      name: 'Republic of China Army', designation: 'ROC Army',
      unitType: 'INFANTRY' as const, branch: 'ARMY' as const, echelon: 'ARMY_LEVEL' as const,
      strength: 130000, latitude: 24.1, longitude: 120.7, faction: 'GREEN',
    },
    {
      name: 'ROC Air Force', designation: 'ROCAF',
      unitType: 'AIR_FIGHTER' as const, branch: 'AIR_FORCE' as const, echelon: 'WING' as const,
      strength: 35000, latitude: 24.8, longitude: 121.0, faction: 'GREEN',
    },
    {
      name: 'ROC Navy', designation: 'ROCN',
      unitType: 'NAVAL_SURFACE' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 15000, latitude: 22.6, longitude: 120.3, faction: 'GREEN',
    },
  ]

  const allUnits = [...blueUnits, ...redUnits, ...greenUnits]
  for (const unit of allUnits) {
    await prisma.militaryUnit.create({
      data: {
        ...unit,
        scenarioId: scenario.id,
        readiness: 0.75 + Math.random() * 0.25,
      },
    })
  }
  console.log(`  Created scenario "${scenario.name}" with ${allUnits.length} units`)

  // ── Create EUCOM demo scenario ────────────────────────────
  const eucomScenario = await prisma.scenario.create({
    data: {
      name: 'Baltic Shield',
      description: `NATO deterrence scenario in the Baltic region. A conventional threat posture along NATO's eastern flank requiring rapid reinforcement and forward defense positioning.

Blue forces (NATO) must demonstrate credible deterrence through Enhanced Forward Presence while maintaining escalation control. Red forces conduct hybrid warfare operations below the threshold of armed conflict.`,
      theater: 'EUCOM',
      status: 'DRAFT',
    },
  })

  const eucomUnits = [
    {
      name: 'V Corps Forward', designation: 'V Corps',
      unitType: 'ARMOR' as const, branch: 'ARMY' as const, echelon: 'CORPS' as const,
      strength: 35000, latitude: 50.1, longitude: 8.7, faction: 'BLUE',
    },
    {
      name: '6th Fleet Mediterranean', designation: '6th Fleet',
      unitType: 'NAVAL_SURFACE' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 12000, latitude: 36.1, longitude: 14.5, faction: 'BLUE',
    },
    {
      name: 'NATO Enhanced Forward Presence', designation: 'NATO eFP',
      unitType: 'INFANTRY' as const, branch: 'ARMY' as const, echelon: 'BRIGADE' as const,
      strength: 8000, latitude: 56.9, longitude: 24.1, faction: 'BLUE',
    },
    {
      name: 'Western Military District', designation: 'WMD Forces',
      unitType: 'ARMOR' as const, branch: 'ARMY' as const, echelon: 'ARMY_LEVEL' as const,
      strength: 100000, latitude: 56.3, longitude: 30.5, faction: 'RED',
    },
    {
      name: 'Baltic Fleet', designation: 'Baltic Fleet',
      unitType: 'NAVAL_SURFACE' as const, branch: 'NAVY' as const, echelon: 'FLEET' as const,
      strength: 15000, latitude: 54.7, longitude: 19.9, faction: 'RED',
    },
  ]

  for (const unit of eucomUnits) {
    await prisma.militaryUnit.create({
      data: {
        ...unit,
        scenarioId: eucomScenario.id,
        readiness: 0.75 + Math.random() * 0.25,
      },
    })
  }
  console.log(`  Created scenario "${eucomScenario.name}" with ${eucomUnits.length} units`)

  console.log('Seeding complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
