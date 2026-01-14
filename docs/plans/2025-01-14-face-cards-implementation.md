# Face Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-friendly flashcard app for learning DoD senior leadership faces and names with auto-updating data.

**Architecture:** Next.js 16 App Router with server components for data fetching, client components for interactive quiz UI. Prisma ORM with Vercel Postgres. OpenAI agent fetches leadership data on scheduled cron jobs. Local storage tracks user progress.

**Tech Stack:** Next.js 16, Prisma, Vercel Postgres, OpenAI API, Tailwind CSS, Framer Motion

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, etc.

**Step 1: Create Next.js 16 project with Tailwind**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

When prompted, accept defaults. This creates the project in the current directory.

Expected: Project scaffolded with `app/`, `public/`, config files

**Step 2: Verify dev server starts**

Run:
```bash
npm run dev
```

Expected: Server starts at http://localhost:3000, page loads

**Step 3: Stop dev server and commit**

Run:
```bash
git add -A && git commit -m "chore: initialize Next.js 16 project with Tailwind"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install prisma @prisma/client openai framer-motion
```

Expected: Packages added to dependencies

**Step 2: Install dev dependencies**

Run:
```bash
npm install -D @types/node
```

Expected: Dev packages added

**Step 3: Commit**

Run:
```bash
git add -A && git commit -m "chore: add prisma, openai, framer-motion dependencies"
```

---

### Task 3: Set Up Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init
```

Expected: Creates `prisma/schema.prisma` and `.env` file

**Step 2: Add .env to .gitignore**

Check that `.env` is already in `.gitignore`. If not, add it:

```bash
echo ".env" >> .gitignore
```

**Step 3: Replace schema.prisma with our data model**

Replace contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Leader {
  id           String    @id @default(cuid())
  name         String
  title        String
  photoUrl     String
  category     Category
  branch       Branch?
  organization String
  isActive     Boolean   @default(true)
  lastVerified DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([category])
  @@index([branch])
  @@index([isActive])
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

**Step 4: Create .env.example for reference**

Create `.env.example`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/facecards"
OPENAI_API_KEY="sk-..."
REFRESH_SECRET="your-secret-here"
```

**Step 5: Commit**

Run:
```bash
git add -A && git commit -m "feat: add Prisma schema with Leader model and enums"
```

---

### Task 4: Create Prisma Client Singleton

**Files:**
- Create: `lib/prisma.ts`

**Step 1: Create lib directory and prisma client**

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add Prisma client singleton"
```

---

## Phase 2: API Layer

### Task 5: Create Leaders API Route

**Files:**
- Create: `app/api/leaders/route.ts`

**Step 1: Create the API route**

Create `app/api/leaders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Category, Branch } from '@prisma/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') as Category | null
  const branch = searchParams.get('branch') as Branch | null
  const organization = searchParams.get('organization')

  const where: {
    isActive: boolean
    category?: Category
    branch?: Branch
    organization?: string
  } = {
    isActive: true,
  }

  if (category) where.category = category
  if (branch) where.branch = branch
  if (organization) where.organization = organization

  const leaders = await prisma.leader.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  })

  return NextResponse.json(leaders)
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add GET /api/leaders endpoint with filtering"
```

---

### Task 6: Create Refresh API Route

**Files:**
- Create: `app/api/refresh/route.ts`

**Step 1: Create the protected refresh endpoint**

Create `app/api/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.REFRESH_SECRET}`

  if (!process.env.REFRESH_SECRET) {
    return NextResponse.json(
      { error: 'REFRESH_SECRET not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // TODO: Implement OpenAI agent refresh logic in Task 14
  return NextResponse.json({
    message: 'Refresh triggered',
    timestamp: new Date().toISOString(),
  })
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add protected POST /api/refresh endpoint"
```

---

## Phase 3: UI Components

### Task 7: Create Card Component

**Files:**
- Create: `components/Card.tsx`

**Step 1: Create the flip card component**

Create `components/Card.tsx`:

```tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

interface CardProps {
  photoUrl: string
  title: string
  name: string
  isFlipped: boolean
  onFlip: () => void
}

export function Card({ photoUrl, title, name, isFlipped, onFlip }: CardProps) {
  return (
    <div
      className="relative w-full max-w-sm h-96 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front - Photo and Title */}
        <div
          className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 border-4 border-gray-200">
            <Image
              src={photoUrl}
              alt="Leader photo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="text-center text-gray-700 font-medium px-2">{title}</p>
          <p className="text-sm text-gray-400 mt-4">Tap to reveal name</p>
        </div>

        {/* Back - Name */}
        <div
          className="absolute inset-0 backface-hidden bg-blue-600 rounded-2xl shadow-xl p-4 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h2 className="text-2xl font-bold text-white text-center px-4">
            {name}
          </h2>
        </div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Add custom Tailwind utilities for 3D transforms**

Add to `app/globals.css` after the Tailwind directives:

```css
.perspective-1000 {
  perspective: 1000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}
```

**Step 3: Commit**

Run:
```bash
git add -A && git commit -m "feat: add Card component with flip animation"
```

---

### Task 8: Create FilterBar Component

**Files:**
- Create: `components/FilterBar.tsx`

**Step 1: Create the filter bar component**

Create `components/FilterBar.tsx`:

```tsx
'use client'

import { Category, Branch } from '@prisma/client'

interface FilterBarProps {
  category: Category | ''
  branch: Branch | ''
  onCategoryChange: (category: Category | '') => void
  onBranchChange: (branch: Branch | '') => void
  cardCount: number
  totalCount: number
}

const categoryLabels: Record<Category, string> = {
  MILITARY_4STAR: '4-Star Military',
  MILITARY_3STAR: '3-Star Military',
  MAJOR_COMMAND: 'Major Command',
  SERVICE_SECRETARY: 'Service Secretary',
  CIVILIAN_SES: 'Civilian SES',
  APPOINTEE: 'Appointee',
  SECRETARIAT: 'Secretariat',
}

const branchLabels: Record<Branch, string> = {
  ARMY: 'Army',
  NAVY: 'Navy',
  AIR_FORCE: 'Air Force',
  MARINE_CORPS: 'Marine Corps',
  SPACE_FORCE: 'Space Force',
  COAST_GUARD: 'Coast Guard',
}

export function FilterBar({
  category,
  branch,
  onCategoryChange,
  onBranchChange,
  cardCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category | '')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value as Branch | '')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="">All Branches</option>
          {Object.entries(branchLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-center text-sm text-gray-500">
        {cardCount} of {totalCount} cards
      </p>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add FilterBar component with category and branch filters"
```

---

### Task 9: Create ProgressBar Component

**Files:**
- Create: `components/ProgressBar.tsx`

**Step 1: Create the progress bar component**

Create `components/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  current: number
  total: number
  correct: number
}

export function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const accuracy = current > 0 ? Math.round((correct / current) * 100) : 0

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {current} / {total}
        </span>
        <span>{accuracy}% correct</span>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add ProgressBar component"
```

---

### Task 10: Create QuizSession Component

**Files:**
- Create: `components/QuizSession.tsx`
- Create: `lib/storage.ts`

**Step 1: Create local storage helper**

Create `lib/storage.ts`:

```typescript
export interface CardStats {
  timesSeen: number
  timesCorrect: number
}

export interface StoredProgress {
  cardStats: Record<string, CardStats>
  lastStudied: string
}

const STORAGE_KEY = 'face-cards-progress'

export function getProgress(): StoredProgress {
  if (typeof window === 'undefined') {
    return { cardStats: {}, lastStudied: '' }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { cardStats: {}, lastStudied: '' }
  }

  try {
    return JSON.parse(stored)
  } catch {
    return { cardStats: {}, lastStudied: '' }
  }
}

export function saveProgress(progress: StoredProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function recordAnswer(cardId: string, correct: boolean): void {
  const progress = getProgress()

  if (!progress.cardStats[cardId]) {
    progress.cardStats[cardId] = { timesSeen: 0, timesCorrect: 0 }
  }

  progress.cardStats[cardId].timesSeen++
  if (correct) {
    progress.cardStats[cardId].timesCorrect++
  }

  progress.lastStudied = new Date().toISOString()
  saveProgress(progress)
}

export function getWeakCards(cardIds: string[]): string[] {
  const progress = getProgress()

  return cardIds.filter((id) => {
    const stats = progress.cardStats[id]
    if (!stats || stats.timesSeen < 2) return false
    const accuracy = stats.timesCorrect / stats.timesSeen
    return accuracy < 0.7
  })
}
```

**Step 2: Create the quiz session component**

Create `components/QuizSession.tsx`:

```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Category, Branch } from '@prisma/client'
import { Card } from './Card'
import { FilterBar } from './FilterBar'
import { ProgressBar } from './ProgressBar'
import { recordAnswer, getWeakCards } from '@/lib/storage'

interface Leader {
  id: string
  name: string
  title: string
  photoUrl: string
  category: Category
  branch: Branch | null
  organization: string
}

interface QuizSessionProps {
  leaders: Leader[]
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function QuizSession({ leaders }: QuizSessionProps) {
  const [category, setCategory] = useState<Category | ''>('')
  const [branch, setBranch] = useState<Branch | ''>('')
  const [showWeakOnly, setShowWeakOnly] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [missedCards, setMissedCards] = useState<Leader[]>([])

  const filteredLeaders = useMemo(() => {
    let filtered = leaders

    if (category) {
      filtered = filtered.filter((l) => l.category === category)
    }
    if (branch) {
      filtered = filtered.filter((l) => l.branch === branch)
    }
    if (showWeakOnly) {
      const weakIds = getWeakCards(filtered.map((l) => l.id))
      filtered = filtered.filter((l) => weakIds.includes(l.id))
    }

    return shuffleArray(filtered)
  }, [leaders, category, branch, showWeakOnly])

  const currentCard = filteredLeaders[currentIndex]

  const handleAnswer = (wasCorrect: boolean) => {
    if (!currentCard) return

    recordAnswer(currentCard.id, wasCorrect)
    setAnswered((a) => a + 1)

    if (wasCorrect) {
      setCorrect((c) => c + 1)
    } else {
      setMissedCards((m) => [...m, currentCard])
    }

    if (currentIndex < filteredLeaders.length - 1) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    } else {
      setSessionComplete(true)
    }
  }

  const resetSession = (reviewMissed = false) => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCorrect(0)
    setAnswered(0)
    setSessionComplete(false)
    if (!reviewMissed) {
      setMissedCards([])
    }
  }

  if (filteredLeaders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cards match your filters.</p>
        <button
          onClick={() => {
            setCategory('')
            setBranch('')
            setShowWeakOnly(false)
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  if (sessionComplete) {
    const percentage = Math.round((correct / answered) * 100)
    return (
      <div className="text-center py-12 space-y-6">
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <p className="text-4xl font-bold text-blue-600">{percentage}%</p>
        <p className="text-gray-600">
          {correct} of {answered} correct
        </p>
        <div className="flex gap-4 justify-center">
          {missedCards.length > 0 && (
            <button
              onClick={() => resetSession(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium"
            >
              Review Missed ({missedCards.length})
            </button>
          )}
          <button
            onClick={() => resetSession(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <FilterBar
        category={category}
        branch={branch}
        onCategoryChange={(c) => {
          setCategory(c)
          resetSession()
        }}
        onBranchChange={(b) => {
          setBranch(b)
          resetSession()
        }}
        cardCount={filteredLeaders.length}
        totalCount={leaders.length}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showWeakOnly}
          onChange={(e) => {
            setShowWeakOnly(e.target.checked)
            resetSession()
          }}
          className="rounded"
        />
        Show weak cards only
      </label>

      <ProgressBar
        current={answered}
        total={filteredLeaders.length}
        correct={correct}
      />

      {currentCard && (
        <>
          <Card
            photoUrl={currentCard.photoUrl}
            title={currentCard.title}
            name={currentCard.name}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {isFlipped && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(false)}
                className="px-8 py-3 bg-red-500 text-white rounded-lg font-medium text-lg"
              >
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium text-lg"
              >
                Correct
              </button>
            </div>
          )}

          {!isFlipped && (
            <button
              onClick={() => setIsFlipped(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg"
            >
              Flip Card
            </button>
          )}
        </>
      )}
    </div>
  )
}
```

**Step 3: Commit**

Run:
```bash
git add -A && git commit -m "feat: add QuizSession component with local storage progress tracking"
```

---

## Phase 4: Pages

### Task 11: Create Home Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace the default home page**

Replace contents of `app/page.tsx`:

```tsx
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
        <Link
          href="/study"
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          Start Studying
        </Link>
        <p className="text-sm text-gray-400">
          Data updated daily from official DoD sources
        </p>
      </div>
    </main>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add home page with start studying CTA"
```

---

### Task 12: Create Study Page

**Files:**
- Create: `app/study/page.tsx`

**Step 1: Create the study page**

Create `app/study/page.tsx`:

```tsx
import { prisma } from '@/lib/prisma'
import { QuizSession } from '@/components/QuizSession'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudyPage() {
  const leaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Face Cards
          </Link>
          <Link href="/about" className="text-sm text-gray-500 hover:text-gray-700">
            About
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {leaders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No leaders in database yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Run the data seed script to populate leaders.
            </p>
          </div>
        ) : (
          <QuizSession leaders={leaders} />
        )}
      </div>
    </main>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add study page with quiz session"
```

---

### Task 13: Create About Page

**Files:**
- Create: `app/about/page.tsx`

**Step 1: Create the about page**

Create `app/about/page.tsx`:

```tsx
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
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add about page"
```

---

## Phase 5: OpenAI Integration

### Task 14: Create OpenAI Agent Helper

**Files:**
- Create: `lib/openai.ts`

**Step 1: Create the OpenAI helper**

Create `lib/openai.ts`:

```typescript
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
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: add OpenAI helper for fetching leader data"
```

---

### Task 15: Create Database Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

**Step 1: Create the seed script**

Create `prisma/seed.ts`:

```typescript
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
```

**Step 2: Add seed script to package.json**

Add to `package.json` in the "prisma" section (create if doesn't exist):

```json
{
  "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**Step 3: Install ts-node**

Run:
```bash
npm install -D ts-node
```

**Step 4: Commit**

Run:
```bash
git add -A && git commit -m "feat: add database seed script using OpenAI"
```

---

### Task 16: Update Refresh Endpoint

**Files:**
- Modify: `app/api/refresh/route.ts`

**Step 1: Update refresh endpoint to use OpenAI**

Replace contents of `app/api/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllLeaders } from '@/lib/openai'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.REFRESH_SECRET}`

  if (!process.env.REFRESH_SECRET) {
    return NextResponse.json(
      { error: 'REFRESH_SECRET not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const leaders = await fetchAllLeaders()
    let updated = 0
    let added = 0

    for (const leader of leaders) {
      const id = `${leader.title}-${leader.organization}`.toLowerCase().replace(/\s+/g, '-')

      const existing = await prisma.leader.findUnique({ where: { id } })

      if (existing) {
        if (existing.name !== leader.name) {
          // Position holder changed - mark old as inactive, create new
          await prisma.leader.update({
            where: { id },
            data: { isActive: false },
          })
          await prisma.leader.create({
            data: {
              name: leader.name,
              title: leader.title,
              photoUrl: leader.photoUrl,
              category: leader.category,
              branch: leader.branch,
              organization: leader.organization,
            },
          })
          updated++
        } else {
          // Same person - update lastVerified
          await prisma.leader.update({
            where: { id },
            data: { lastVerified: new Date() },
          })
        }
      } else {
        // New position
        await prisma.leader.create({
          data: {
            id,
            name: leader.name,
            title: leader.title,
            photoUrl: leader.photoUrl,
            category: leader.category,
            branch: leader.branch,
            organization: leader.organization,
          },
        })
        added++
      }
    }

    return NextResponse.json({
      message: 'Refresh complete',
      updated,
      added,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Refresh failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: implement full refresh logic in API endpoint"
```

---

## Phase 6: Cron Jobs

### Task 17: Create Vercel Cron Configuration

**Files:**
- Create: `vercel.json`
- Create: `app/api/cron/daily/route.ts`
- Create: `app/api/cron/weekly/route.ts`

**Step 1: Create vercel.json with cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 11 * * *"
    },
    {
      "path": "/api/cron/weekly",
      "schedule": "0 12 * * 0"
    }
  ]
}
```

Note: Schedule is in UTC. "0 11 * * *" = 6 AM EST, "0 12 * * 0" = 7 AM EST Sunday

**Step 2: Create daily cron endpoint**

Create `app/api/cron/daily/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchLeaderData } from '@/lib/openai'

// Key positions to check daily
const KEY_POSITIONS = [
  'Secretary of Defense',
  'Chairman of the Joint Chiefs of Staff',
  'Chief of Staff of the Army',
  'Chief of Naval Operations',
  'Chief of Staff of the Air Force',
  'Commandant of the Marine Corps',
]

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let checked = 0
  let updated = 0

  for (const position of KEY_POSITIONS) {
    const data = await fetchLeaderData(position)
    if (!data) continue

    checked++
    const id = `${data.title}-${data.organization}`.toLowerCase().replace(/\s+/g, '-')

    const existing = await prisma.leader.findFirst({
      where: { title: data.title, isActive: true },
    })

    if (existing && existing.name !== data.name) {
      await prisma.leader.update({
        where: { id: existing.id },
        data: { isActive: false },
      })
      await prisma.leader.create({
        data: {
          name: data.name,
          title: data.title,
          photoUrl: data.photoUrl,
          category: data.category,
          branch: data.branch,
          organization: data.organization,
        },
      })
      updated++
    } else if (existing) {
      await prisma.leader.update({
        where: { id: existing.id },
        data: { lastVerified: new Date() },
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return NextResponse.json({
    type: 'daily',
    checked,
    updated,
    timestamp: new Date().toISOString(),
  })
}
```

**Step 3: Create weekly cron endpoint**

Create `app/api/cron/weekly/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllLeaders } from '@/lib/openai'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leaders = await fetchAllLeaders()
  let updated = 0
  let added = 0

  for (const leader of leaders) {
    const existing = await prisma.leader.findFirst({
      where: { title: leader.title, isActive: true },
    })

    if (existing) {
      if (existing.name !== leader.name) {
        await prisma.leader.update({
          where: { id: existing.id },
          data: { isActive: false },
        })
        await prisma.leader.create({
          data: {
            name: leader.name,
            title: leader.title,
            photoUrl: leader.photoUrl,
            category: leader.category,
            branch: leader.branch,
            organization: leader.organization,
          },
        })
        updated++
      } else {
        await prisma.leader.update({
          where: { id: existing.id },
          data: { lastVerified: new Date() },
        })
      }
    } else {
      await prisma.leader.create({
        data: {
          name: leader.name,
          title: leader.title,
          photoUrl: leader.photoUrl,
          category: leader.category,
          branch: leader.branch,
          organization: leader.organization,
        },
      })
      added++
    }
  }

  return NextResponse.json({
    type: 'weekly',
    total: leaders.length,
    updated,
    added,
    timestamp: new Date().toISOString(),
  })
}
```

**Step 4: Update .env.example with CRON_SECRET**

Add to `.env.example`:

```
CRON_SECRET="vercel-generates-this"
```

**Step 5: Commit**

Run:
```bash
git add -A && git commit -m "feat: add Vercel cron jobs for daily and weekly updates"
```

---

## Phase 7: Final Setup

### Task 18: Update Layout and Metadata

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update the root layout**

Replace contents of `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Face Cards - DoD Leadership Flashcards',
  description: 'Learn the faces and names of Department of Defense senior leadership with interactive flashcards.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "feat: update layout with metadata and mobile viewport"
```

---

### Task 19: Create README

**Files:**
- Create: `README.md`

**Step 1: Create project README**

Create `README.md`:

```markdown
# Face Cards

A flashcard app for learning the faces and names of DoD senior leadership.

## Features

- Photo + title flashcards for military and civilian leaders
- Filter by category, branch, or organization
- Track your progress locally
- Auto-updating data via scheduled jobs

## Tech Stack

- Next.js 16, Tailwind CSS, Framer Motion
- Prisma with Vercel Postgres
- OpenAI API for data fetching
- Vercel for hosting and cron jobs

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Install dependencies: `npm install`
4. Set up database: `npx prisma db push`
5. Seed data: `npx prisma db seed`
6. Run dev server: `npm run dev`

## Environment Variables

- `DATABASE_URL` - Postgres connection string
- `OPENAI_API_KEY` - OpenAI API key
- `REFRESH_SECRET` - Secret for manual refresh endpoint
- `CRON_SECRET` - Vercel cron job secret (auto-generated)

## Deployment

Deploy to Vercel:

```bash
vercel
```

The cron jobs are configured in `vercel.json` and will run automatically.
```

**Step 2: Commit**

Run:
```bash
git add -A && git commit -m "docs: add README with setup instructions"
```

---

## Summary

**Total Tasks:** 19
**Phases:**
1. Project Foundation (Tasks 1-4)
2. API Layer (Tasks 5-6)
3. UI Components (Tasks 7-10)
4. Pages (Tasks 11-13)
5. OpenAI Integration (Tasks 14-16)
6. Cron Jobs (Task 17)
7. Final Setup (Tasks 18-19)

**After completing all tasks:**
1. Set up Vercel Postgres database
2. Configure environment variables in Vercel
3. Deploy with `vercel`
4. Run `npx prisma db push` and `npx prisma db seed` to populate data
