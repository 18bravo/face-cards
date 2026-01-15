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
