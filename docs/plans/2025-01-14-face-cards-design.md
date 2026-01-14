# Face Cards - DoD Senior Leadership Flashcard App

## Overview

A public flashcard app for learning the faces and names of DoD senior leadership. Users see a photo and title, mentally guess the name, flip the card to verify, and mark correct/incorrect. Data auto-updates via scheduled OpenAI agent queries.

## Target Users

Government employees, military personnel, contractors, and anyone who needs to recognize DoD senior leadership by sight.

## Scope of Leadership Covered

- **Military**: 3-star (O-9) and above, Major Command leadership
- **Civilian**: SES (Senior Executive Service), Service Secretaries, Presidential Appointees, Secretariat staff

## Core Features

### Flashcard Study
- Card front: Photo (prominent) + Title
- Card back: Name
- Simple flip and self-grade (correct/incorrect)
- Mobile-friendly, tap to flip, swipe for correct/incorrect

### Organization & Filtering
- Pre-defined categories: Military 4-star, Military 3-star, Civilian SES, Appointees, Secretariat
- Filters by category, branch (Army, Navy, Air Force, etc.), organization
- "Weak cards" filter for cards frequently missed

### Progress Tracking
- Local storage (browser-based, no login required)
- Tracks per-card stats: times seen, times correct
- Session summary with score and percentage

### Auto-Updating Data
- Daily cron job checks key positions (SECDEF, CJCS, Service Chiefs)
- Weekly full sweep of all tracked positions
- OpenAI agent queries authoritative sources (Defense.gov, service branch sites)
- Old holders marked inactive, new holders inserted

## Data Model

```prisma
model Leader {
  id           String    @id @default(cuid())
  name         String    // "General Charles Q. Brown Jr."
  title        String    // "Chairman of the Joint Chiefs of Staff"
  photoUrl     String    // URL to official photo
  category     Category  // MILITARY_4STAR, MILITARY_3STAR, CIVILIAN_SES, APPOINTEE, SECRETARIAT
  branch       Branch?   // ARMY, NAVY, AIR_FORCE, MARINE_CORPS, SPACE_FORCE, COAST_GUARD
  organization String    // "Joint Chiefs of Staff", "Department of the Army"
  isActive     Boolean   @default(true)
  lastVerified DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Category {
  MILITARY_4STAR
  MILITARY_3STAR
  MAJOR_COMMAND
  SERVICE_SECRETARY
  CIVILIAN_SES
  APPOINTEE
  SECRETARIAT
}

enum Branch {
  ARMY
  NAVY
  AIR_FORCE
  MARINE_CORPS
  SPACE_FORCE
  COAST_GUARD
}
```

## User Interface

### Pages
1. **Home (`/`)** - Landing with description and "Start Studying" button
2. **Study (`/study`)** - Flashcard interface with filters
3. **About (`/about`)** - Data sources and update frequency info

### Study Page Layout
- Top: Filter dropdowns + card count ("12 of 47 cards")
- Center: Large flip card (photo/title on front, name on back)
- Bottom: Flip button, progress indicator, correct/incorrect buttons
- Mobile: Tap to flip, swipe for grading

### Quiz Flow
1. Select filters (optional, defaults to all)
2. Cards shuffle randomly
3. View card, flip, mark correct/incorrect
4. End summary with score
5. Options: "Review Missed" or "Start Over"

## Tech Stack

- **Next.js 16** - App Router, Turbopack
- **Vercel** - Hosting, cron jobs, serverless functions
- **Vercel Postgres** - Database
- **Prisma** - ORM
- **OpenAI API** - Data fetching agent
- **Tailwind CSS** - Mobile-first styling
- **Framer Motion** - Card flip animations

## Project Structure

```
/app
  /page.tsx              # Home
  /study/page.tsx        # Flashcard UI
  /about/page.tsx        # About page
  /api
    /leaders/route.ts    # GET leaders with filters
    /refresh/route.ts    # Manual update trigger (secret-protected)
/components
  /Card.tsx              # Flip card component
  /FilterBar.tsx         # Category/branch/org filters
  /QuizSession.tsx       # Quiz state management
  /ProgressBar.tsx       # Visual progress indicator
/lib
  /prisma.ts             # Prisma client singleton
  /openai.ts             # OpenAI agent helpers
  /fetchLeaders.ts       # Data fetching logic
/prisma
  /schema.prisma         # Database schema
  /seed.ts               # Initial data population
```

## Environment Variables

```
DATABASE_URL=           # Postgres connection string
OPENAI_API_KEY=         # OpenAI API key
REFRESH_SECRET=         # Secret for manual refresh endpoint
```

## Data Sources

The OpenAI agent will query these authoritative sources:
- Defense.gov official bios and photos
- Service branch official sites (army.mil, navy.mil, af.mil, etc.)
- Pentagon Leadership page
- Wikipedia (cross-reference only)

## Update Schedule

| Job | Frequency | Scope |
|-----|-----------|-------|
| Quick check | Daily 6 AM EST | Key positions (SECDEF, CJCS, Service Chiefs) |
| Full sweep | Weekly (Sunday) | All tracked positions |

## Success Criteria

- Users can study all DoD senior leadership by face
- Data stays current within one week of leadership changes
- Mobile experience is smooth and intuitive
- Quiz progress persists across browser sessions
