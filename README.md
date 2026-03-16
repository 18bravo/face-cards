# EnderAI

**AI-powered global battle simulation platform** with real-time combat modeling, swarm intelligence, and 3D globe visualization.

EnderAI combines a deterministic tick-based simulation engine with CesiumJS 3D terrain, dynamic weather/terrain combat modifiers, multi-faction AI, and an intelligence feed pipeline — enabling full-scale campaign modeling from INDOPACOM to EUCOM and beyond.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Simulation Engine](#simulation-engine)
- [Combat Model](#combat-model)
- [Weather & Terrain](#weather--terrain-system)
- [Intelligence Feeds](#intelligence-feeds)
- [MiroFish Integration](#mirofish-swarm-engine)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Deployment](#deployment)

---

## Features

### 3D/2D Globe Visualization
- **CesiumJS** 3D globe with real-world terrain imagery and unit markers
- **MapLibreGL** 2D tactical map with detection rings and engagement lines
- Toggle between 3D globe and 2D tactical views
- Theater zoom presets (INDOPACOM, EUCOM, CENTCOM, AFRICOM, SOUTHCOM, NORTHCOM, GLOBAL)

### Tick-Based Simulation Engine
- Deterministic simulation loop (1 tick = 1 hour)
- Multi-phase processing: AI orders, movement, detection, engagement, readiness, supply, weather
- Configurable tick speed (0.5x, 1x, 2x, 5x)
- Snapshot save/restore at any point
- JSON scenario export/import

### Combat Resolution
- Haversine-based distance calculations on WGS84
- Unit-type-specific detection ranges (80km infantry to 9999km cyber)
- Engagement ranges (3km infantry to 1500km missiles)
- Force-ratio casualty model with stochastic variance
- Posture bonuses (1.3x for defending units)

### Dynamic Environment
- 5 weather conditions (CLEAR, OVERCAST, RAIN, STORM, FOG) with combat multipliers
- 7 terrain types (OPEN, URBAN, MOUNTAIN, FOREST, COASTAL, OCEAN, DESERT)
- Weather evolves stochastically every 12 ticks
- Terrain-based defense bonuses (1.8x mountain, 1.5x urban)
- Infantry advantage in favorable terrain

### Faction AI System
- **RED Force AI**: Aggressive doctrine — attacks nearest detected hostiles, advances toward enemies within 2x engagement range
- **BLUE Force AI**: Defensive doctrine — engages threats within detection range, holds positions
- Static defense units (MISSILE, AIR_DEFENSE, CYBER) hold position and engage at range
- Alliance system: BLUE-GREEN allied, NEUTRAL non-combatant
- Toggleable AI per faction

### Logistics & Supply
- Supply lines tracked from LOGISTICS units (500km effective range)
- Supply level degrades when out of range (0.01/tick)
- Readiness penalty when supply falls below 30%
- Supply warning events at critical levels (<20%)

### Unit Hierarchy
- Echelon-ranked command tree (ARMY > CORPS > DIVISION > BRIGADE > REGIMENT > BATTALION)
- Interactive expandable/collapsible tree view
- Click-to-select units from hierarchy

### Intelligence Feed Pipeline
- Ingests 8 RSS defense news sources (Defense News, Breaking Defense, War on the Rocks, CSIS, Reuters, CyberScoop, Janes, The Drive)
- GPT-4o analysis for military relevance scoring, threat levels, and entity extraction
- AI-generated scenarios from selected articles

### After-Action Reports
- Force summary with initial vs. final strength per faction
- Casualty statistics and engagement counts
- Key event timeline (FLASH/CRITICAL severity)
- Winner determination by casualty ratio

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              EnderAI Frontend               │
                    │                                             │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                    │  │  Globe   │  │ Sim Panel │  │  Feeds   │  │
                    │  │ (Cesium) │  │  (ORBAT,  │  │  (RSS +  │  │
                    │  │  + 2D    │  │  Timeline,│  │  OpenAI) │  │
                    │  │ Tactical │  │  Deploy)  │  │          │  │
                    │  └────┬─────┘  └────┬──────┘  └────┬─────┘  │
                    │       │             │              │         │
                    │  ┌────▼─────────────▼──────────────▼─────┐  │
                    │  │        Simulation Engine (client)       │ │
                    │  │  Movement · Detection · Combat · Supply │ │
                    │  │  Weather · Terrain · Faction AI · AAR   │ │
                    │  └────────────────┬───────────────────────┘  │
                    └───────────────────┼──────────────────────────┘
                                        │
                    ┌───────────────────▼──────────────────────────┐
                    │            Next.js API Routes                │
                    │  /api/scenarios  /api/units  /api/simulations │
                    │  /api/feeds/articles  /api/feeds/ingest       │
                    │  /api/feeds/generate-scenario                 │
                    └───────────────────┬──────────────────────────┘
                                        │
              ┌─────────────────────────┼───────────────────────┐
              │                         │                       │
     ┌────────▼────────┐    ┌───────────▼─────────┐   ┌────────▼────────┐
     │  PostgreSQL/Neon │    │   OpenAI GPT-4o     │   │  MiroFish API   │
     │  (Prisma ORM)   │    │  (Feed analysis,    │   │  (OASIS swarm   │
     │                  │    │   scenario gen)     │   │   simulation)   │
     └─────────────────┘    └─────────────────────┘   └─────────────────┘
```

---

## Simulation Engine

The simulation engine (`lib/simulation-engine.ts`) is a pure-function, client-side tick processor. Each call to `advanceTick(state)` returns a new immutable state.

### Tick Phases

| Phase | Name | Description |
|-------|------|-------------|
| 0 | **Faction AI** | Auto-issues orders for idle RED/BLUE units based on doctrine |
| 1 | **Movement** | Executes MOVE, ATTACK, PATROL, WITHDRAW, RECON orders with speed modifiers |
| 2 | **Detection** | Scans for hostiles within weather-adjusted detection ranges |
| 3 | **Engagement** | Resolves combat between hostile units within engagement range |
| 4 | **Readiness** | Recovers idle units, degrades moving/engaged units |
| 4.5 | **Supply** | Calculates supply distances, degrades unsupplied units |
| 5 | **Weather** | Stochastic weather evolution every 12 ticks |
| 6 | **SITREP** | Generates status report every 5 ticks |

### State Management

```typescript
interface SimulationState {
  tick: number                              // Current simulation hour
  units: UnitMarker[]                       // All unit positions and status
  orders: Map<string, UnitOrder>            // Active orders per unit
  events: SimulationEvent[]                 // Full event log
  detections: Map<string, Set<string>>      // Who detects whom
  engagements: Engagement[]                 // Active engagements
  supply: Map<string, SupplyState>          // Supply levels per unit
  environment: EnvironmentState             // Weather + terrain
  isRunning: boolean                        // Simulation active flag
  aiEnabled: { blue: boolean; red: boolean } // Faction AI toggles
}
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `createInitialState(units, weather?)` | Initialize simulation from unit list |
| `advanceTick(state)` | Process one simulation tick |
| `issueOrder(state, order)` | Issue movement/combat orders |
| `setWeather(state, weather)` | Override weather condition |
| `setAIEnabled(state, faction, enabled)` | Toggle faction AI |
| `takeSnapshot(state)` / `restoreSnapshot(snap)` | Save/restore state |
| `exportScenario(name, state)` / `importScenario(data)` | JSON export/import |
| `generateAfterActionReport(initial, state)` | Produce AAR statistics |
| `resetSimulation(units)` | Full reset to initial state |

---

## Combat Model

### Force Ratio Resolution

Combat power is calculated as:

```
CombatPower = BASE_POWER[unitType] * readiness * (strength / 10000)
```

Base power values range from 0.5 (LOGISTICS) to 10.0 (CARRIER_GROUP).

Casualties are computed using adjusted force ratios:

```
adjustedRatio = attackerPower / (attackerPower + defenderPower * defenseBonus)
attackerLosses = strength * (1 - adjustedRatio) * 0.05 * random(0.8, 1.2)
defenderLosses = strength * adjustedRatio * 0.08 * random(0.8, 1.2)
```

### Unit Capabilities

| Unit Type | Detection | Engagement | Speed | Combat Power |
|-----------|-----------|------------|-------|-------------|
| CARRIER_GROUP | 250 km | 300 km | 55 km/h | 10.0 |
| MISSILE | — | 1,500 km | — | 8.0 |
| AIR_FIGHTER | 300 km | 200 km | 900 km/h | 6.0 |
| AIR_BOMBER | — | 500 km | 800 km/h | 7.0 |
| NAVAL_SUBSURFACE | — | — | 45 km/h | 5.5 |
| ARMOR | — | 5 km | 40 km/h | 5.0 |
| ARTILLERY | — | 40 km | 20 km/h | 4.5 |
| AIR_DEFENSE | 150 km | 100 km | — | 4.0 |
| INFANTRY | — | 3 km | 25 km/h | 3.0 |
| SPECIAL_OPS | — | 2 km | 30 km/h | 6.0 |
| CYBER | 9,999 km | — | — | 2.0 |
| AIR_ISR | 500 km | — | 600 km/h | — |
| UAV | 350 km | — | 400 km/h | — |
| RADAR | 400 km | — | — | — |

---

## Weather & Terrain System

### Weather Conditions

| Condition | Detection | Speed | Air Power | Notes |
|-----------|-----------|-------|-----------|-------|
| CLEAR | 100% | 100% | 100% | Baseline |
| OVERCAST | 90% | 100% | 90% | Slight air degradation |
| RAIN | 70% | 85% | 70% | Moderate impact |
| STORM | 40% | 60% | 30% | Severe — grounds most air ops |
| FOG | 30% | 70% | 50% | Heavy detection penalty |

Weather transitions every 12 ticks using weighted random selection favoring adjacent conditions (CLEAR <-> OVERCAST <-> RAIN <-> STORM, FOG).

### Terrain Types

| Terrain | Defense Bonus | Speed Mod | Infantry Bonus | Example Regions |
|---------|--------------|-----------|----------------|-----------------|
| OPEN | 1.0x | 100% | 1.0x | Plains, steppes |
| URBAN | 1.5x | 50% | 1.4x | Tokyo, Beijing, Taipei |
| MOUNTAIN | 1.8x | 30% | 1.3x | Himalayas, Alps |
| FOREST | 1.4x | 60% | 1.2x | Siberian taiga |
| COASTAL | 1.1x | 90% | 1.0x | Mediterranean coast |
| OCEAN | 1.0x | 100% | 0.2x | Open water |
| DESERT | 0.9x | 80% | 0.8x | Sahara, Arabian Peninsula |

Terrain is estimated from latitude/longitude using geographic heuristics. Air and naval units bypass terrain speed modifiers.

---

## Intelligence Feeds

EnderAI ingests and analyzes defense news via RSS:

| Source | Focus |
|--------|-------|
| Defense News | US defense policy and procurement |
| Breaking Defense | Military technology and strategy |
| War on the Rocks | Strategic analysis and commentary |
| CSIS | Think tank analysis |
| Reuters Defense | Global defense news |
| CyberScoop | Cybersecurity and cyber warfare |
| Janes | Defense intelligence |
| The Drive / War Zone | Military aviation and technology |

### Processing Pipeline

1. **Ingest** — Fetches RSS XML, extracts articles with lightweight parser
2. **Analyze** — GPT-4o scores military relevance (0-1), assigns threat level (LOW/MEDIUM/HIGH/CRITICAL), extracts entities (countries, units, weapons)
3. **Generate** — Creates detailed scenarios from selected articles with unit placements and objectives

---

## MiroFish Swarm Engine

EnderAI integrates with the MiroFish/OASIS multi-agent simulation backend for large-scale social dynamics modeling.

### Architecture

```
MiroFish/OASIS Engine
├─ Agent Personas (commander, analyst, ops)
├─ GraphRAG Knowledge Base
├─ OpenViking Context Memory
├─ Dual Platform Interaction
│  ├─ Military Command Net
│  └─ Informal Channel
└─ Prediction Report Generator
```

### Capabilities
- Up to 1M concurrent agents
- Configurable environment factors (economics, political stability, military readiness)
- SSE event streaming for real-time updates
- Prediction reports with confidence scoring

Set `MIROFISH_API_URL` to connect to a running MiroFish backend instance.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 16.1.2 |
| **Runtime** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **3D Globe** | CesiumJS + Resium | 1.139.1 |
| **2D Maps** | MapLibreGL | 5.20.1 |
| **Database** | PostgreSQL (Neon serverless) | — |
| **ORM** | Prisma | 7.2.0 |
| **AI** | OpenAI GPT-4o | 6.16.0 |
| **Auth** | jose (JWT) | 6.1.3 |
| **Validation** | Zod | 4.3.5 |
| **Animation** | Framer Motion | 12.26.2 |
| **Styling** | Tailwind CSS | 4.x |
| **Testing** | Vitest | 4.1.0 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) serverless)
- OpenAI API key (for feed analysis and scenario generation)

### Installation

```bash
# Clone the repository
git clone https://github.com/18bravo/EnderAI.git
cd EnderAI

# Install dependencies (also copies CesiumJS assets)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Quick Start

1. Navigate to `/globe` for the main simulation interface
2. The demo scenario loads 18 INDOPACOM units (BLUE/RED/GREEN)
3. Click **START** to begin the simulation
4. Use the **ORBAT** tab to view unit status, **TREE** for hierarchy, **TIMELINE** for events
5. Toggle RED/BLUE AI, change weather, adjust tick speed from the header controls
6. Click any unit on the globe to select it, then issue orders (MOVE, ATTACK, DEFEND)
7. Use **EXPORT** to save the scenario as JSON, **IMPORT** to load one

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon recommended) |
| `OPENAI_API_KEY` | For feeds | OpenAI API key for GPT-4o analysis |
| `JWT_SECRET` | For auth | Secret for JWT session tokens |
| `REFRESH_SECRET` | Optional | Secret for manual data refresh endpoint |
| `CRON_SECRET` | Optional | Vercel cron job authentication secret |
| `MIROFISH_API_URL` | Optional | MiroFish backend URL for swarm simulations |

---

## Database Schema

### Core Models

```
MilitaryUnit ── Scenario ── ScenarioEvent
     │              │
     │              ├── Simulation (MiroFish runs)
     │              │
     └── Movement   └── ScenarioFeedArticle ── FeedArticle ── RssFeed
```

| Model | Purpose |
|-------|---------|
| `MilitaryUnit` | Units with hierarchy, position, status, readiness |
| `Scenario` | Named scenarios with theater, status, tick tracking |
| `Movement` | Unit movement orders with tick-based completion |
| `ScenarioEvent` | Events (ENGAGEMENT, DETECTION, CASUALTY, WEATHER) with severity |
| `Simulation` | MiroFish simulation runs with config and results |
| `RssFeed` | RSS feed sources with last-fetch tracking |
| `FeedArticle` | Articles with AI-scored relevance, threat level, entities |
| `AuditLog` | NIST 800-53r5 security audit trail |
| `RevokedToken` | JWT token revocation tracking |

### Enums

- **UnitType**: 22 types (INFANTRY, ARMOR, ARTILLERY, AIR_DEFENSE, CARRIER_GROUP, MISSILE, CYBER, UAV, etc.)
- **Branch**: ARMY, NAVY, AIR_FORCE, MARINE_CORPS, SPACE_FORCE, COAST_GUARD
- **Echelon**: FIRE_TEAM through AIR_FORCE_LEVEL (13 levels)
- **Theater**: INDOPACOM, EUCOM, CENTCOM, AFRICOM, SOUTHCOM, NORTHCOM, GLOBAL
- **Severity**: INFO, WARNING, CRITICAL, FLASH

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| **Simulation Engine** | 54+ | State creation, movement, detection, combat, AI, supply, weather, terrain, snapshots, export/import, AAR |
| **Smoke Tests** | 10+ | Type exports, constant shapes, function signatures, module structure |

All simulation engine tests are deterministic (seeded or bounded-random) and run in <100ms.

---

## Project Structure

```
EnderAI/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with metadata
│   ├── globals.css                 # Tailwind + custom HUD styles
│   ├── globe/
│   │   └── page.tsx                # Main simulation interface
│   ├── simulation/
│   │   └── page.tsx                # Scenario management
│   ├── feeds/
│   │   └── page.tsx                # Intelligence feed browser
│   └── api/
│       ├── scenarios/              # Scenario CRUD
│       ├── units/                  # Unit CRUD
│       ├── simulations/            # MiroFish launch
│       └── feeds/
│           ├── articles/           # Article listing
│           ├── ingest/             # RSS ingestion trigger
│           └── generate-scenario/  # AI scenario generation
├── components/
│   ├── GlobeViewer.tsx             # CesiumJS 3D globe
│   ├── TacticalMap.tsx             # MapLibreGL 2D map
│   ├── SimulationPanel.tsx         # Right-side control panel
│   ├── Timeline.tsx                # Event timeline + heatmap
│   ├── FeedPanel.tsx               # RSS article browser
│   ├── UnitPlacement.tsx           # Unit deployment form
│   ├── UnitHierarchy.tsx           # Command hierarchy tree
│   └── AfterActionReport.tsx       # AAR modal
├── lib/
│   ├── simulation-engine.ts        # Core simulation logic (900+ lines)
│   ├── mirofish.ts                 # MiroFish API integration
│   ├── feeds.ts                    # RSS + OpenAI analysis
│   ├── admin-auth.ts               # JWT authentication
│   ├── prisma.ts                   # Database client
│   ├── audit.ts                    # NIST audit logging
│   └── validations.ts              # Zod schemas
├── types/
│   └── military.ts                 # Core domain types + constants
├── prisma/
│   ├── schema.prisma               # Database schema (335 lines)
│   └── seed.ts                     # Database seeder
├── __tests__/
│   ├── simulation-engine.test.ts   # Engine tests (54+ cases)
│   └── smoke.test.ts               # Module smoke tests
├── public/
│   └── cesium/                     # CesiumJS static assets
├── next.config.ts                  # Security headers + image config
├── vitest.config.ts                # Test configuration
├── tailwind.config.ts              # Styling configuration
└── package.json                    # Dependencies + scripts
```

---

## API Reference

### Scenarios

```
GET  /api/scenarios              # List all scenarios
POST /api/scenarios              # Create scenario { name, theater, description }
```

### Units

```
GET  /api/units?scenarioId=...   # List units for scenario
POST /api/units                  # Create unit { scenarioId, name, designation, ... }
```

### Simulations

```
GET  /api/simulations            # List simulation runs
POST /api/simulations            # Launch MiroFish simulation { scenarioId, config }
```

### Intelligence Feeds

```
GET  /api/feeds/articles?limit=50&offset=0    # Paginated articles
POST /api/feeds/ingest                         # Trigger RSS ingestion
POST /api/feeds/generate-scenario              # Generate scenario from articles
     Body: { articleIds: string[], theater: string }
```

All endpoints validate input with Zod schemas and log actions via the audit system.

---

## Security

EnderAI implements security controls aligned with NIST 800-53r5:

| Control | Implementation |
|---------|---------------|
| **Authentication** | JWT sessions with 24-hour expiration (jose) |
| **Credential Safety** | Timing-safe comparison to prevent timing attacks |
| **Token Revocation** | Database-tracked revocation list |
| **Input Validation** | Zod schemas on all API inputs |
| **Audit Logging** | All scenario, unit, simulation, and auth actions logged |
| **HTTP Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| **CSP** | Content Security Policy headers |
| **Image Sources** | Restricted remote patterns (Cesium, Defense.gov only) |

---

## Deployment

### Vercel (Recommended)

```bash
# Build (copies Cesium assets, generates Prisma client)
npm run build

# Deploy
vercel
```

Cron jobs for feed ingestion are configured in `vercel.json`.

### Manual

```bash
npm run build
npm start
```

Ensure `DATABASE_URL` points to an accessible PostgreSQL instance and CesiumJS assets are copied to `public/cesium/`.

---

## Demo Scenario

The default simulation loads an INDOPACOM theater scenario with 18 units:

**BLUE (US/Allied)**
- 7th Fleet (Carrier Group) — Philippine Sea
- III MEF (Amphibious) — Okinawa
- 2nd Infantry Division — South Korea
- CVN-78 Ford CSG — Western Pacific
- 5th Air Force (Fighter Wing) — Japan
- JGSDF (Infantry) — Kyushu
- SUBPAC (Submarine) — Western Pacific

**RED (Opposing)**
- 73rd Group Army (Armor) — Fujian
- Eastern Theater Navy — East China Sea
- PLARF Eastern (Missile) — Inland China
- PLAAF Eastern (Fighter) — Coastal China
- 71st Group Army (Infantry) — Zhejiang
- SSF Cyber Unit — Beijing
- Southern Theater Navy — South China Sea

**GREEN (Partner)**
- ROC Army — Western Taiwan
- ROCAF — Central Taiwan
- ROCN — Kaohsiung

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build (Cesium + Prisma + Next.js)
npm start            # Start production server
npm test             # Run test suite
npm run test:watch   # Watch mode testing
npm run lint         # ESLint check
npm run copy-cesium  # Copy CesiumJS assets to public/
```

---

## License

Private repository. All rights reserved.
