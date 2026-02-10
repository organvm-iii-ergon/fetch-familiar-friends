[![ORGAN-III: Ergon](https://img.shields.io/badge/ORGAN--III-Ergon-1b5e20?style=flat-square)](https://github.com/organvm-iii-ergon)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-f7df1e?style=flat-square&logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![React](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react&logoColor=000)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

# Fetch Familiar Friends

**A social pet calendar, care tracker, and gamified companion app for dog and cat owners — built on React 18, Supabase, and Stripe.**

Fetch Familiar Friends (internally branded *DogTale Daily*) is a consumer-facing B2C progressive web application that transforms everyday pet ownership into an engaging daily ritual. The app delivers personalized dog and cat imagery each day, layered with journaling, health tracking, social networking, a full gamification engine, and a three-tier subscription model. It sits within [ORGAN-III (Ergon)](https://github.com/organvm-iii-ergon), the commerce organ of the eight-organ creative-institutional system, and represents a production-ready consumer product with real monetization infrastructure.

---

## Table of Contents

- [Product Overview](#product-overview)
- [Technical Architecture](#technical-architecture)
- [Core Feature Set](#core-feature-set)
- [Installation and Quick Start](#installation-and-quick-start)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Integrations](#api-integrations)
- [Gamification Engine](#gamification-engine)
- [Subscription and Monetization](#subscription-and-monetization)
- [Testing](#testing)
- [Scripts and Tooling](#scripts-and-tooling)
- [Cross-Organ References](#cross-organ-references)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Product Overview

Pet ownership in the digital age lacks a single hub that combines daily delight with practical care management. Fetch Familiar Friends solves this by merging four distinct value propositions into one application:

1. **Daily content ritual.** Each day surfaces a new breed-specific dog or cat image via the Dog CEO and TheCatAPI services, accompanied by breed knowledge, fun facts, and a daily content seed that makes every visit feel fresh.

2. **Care management.** Owners track vaccinations, vet visits, medications, weight history, grooming schedules, and custom reminders — all attached to individual pet profiles with full health timelines.

3. **Social platform.** An activity feed, friend lists, reactions (like, love, paw, wow), comments, and a proximity-based "Nearby Pet Parents" feature create a lightweight social network purpose-built for the pet community.

4. **Gamification layer.** Quests, achievements, XP leveling, virtual pets, gym battles, PvP matchmaking, season passes, and leaderboards borrow proven engagement mechanics from mobile gaming to drive daily retention.

The combination positions the product as a *daily companion app* rather than a single-purpose utility, targeting the recurring-engagement model that sustains consumer subscription businesses.

### Target Audience

- Dog and cat owners who want a daily touchpoint with their pet's life
- Pet parents managing multiple animals and recurring care schedules
- Social pet communities seeking a dedicated, non-generic platform
- Casual gamers who enjoy collection and progression mechanics

### Business Model

The app operates a freemium SaaS model with three subscription tiers managed through Stripe:

| Tier | AI Messages/Day | Features |
|------|-----------------|----------|
| **Free** | 5 | Core calendar, journaling, favorites, basic health tracking |
| **Premium** | 50 | Full social hub, advanced gamification, coaching hub, extended AI |
| **Luxury** | 500 | Telemedicine, AR camera, unlimited AI, priority support |

Stripe checkout sessions, customer portal management, and webhook-driven subscription state synchronization are implemented via Supabase Edge Functions running on Deno Deploy.

---

## Technical Architecture

The application is built as a single-page progressive web app with a clear separation between the client-side React application and the Supabase backend-as-a-service layer.

### Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18.2 (JSX) | Component model, concurrent features |
| **Build** | Vite 7 | Development server, HMR, production bundling |
| **Styling** | Tailwind CSS 3 + custom design tokens | Utility-first CSS with `surface-*` and `primary-*` token system |
| **Animation** | Framer Motion 12 | Page transitions, micro-interactions, reduced-motion awareness |
| **Icons** | Lucide React | Consistent iconography across all components |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) | Database, authentication, real-time subscriptions, serverless compute |
| **Payments** | Stripe (via Supabase Edge Functions) | Checkout sessions, customer portal, webhook processing |
| **Testing** | Vitest + Testing Library + Happy DOM | Unit and integration testing with React component coverage |
| **Linting** | ESLint 9 + Prettier | Code quality and formatting enforcement |
| **PWA** | Custom service worker (`public/sw.js`) + Web App Manifest | Offline support, installability, background sync |

### Architecture Diagram

```
Browser (PWA)
├── React 18 SPA
│   ├── Context Providers (Auth, Subscription, Achievement, ReducedMotion)
│   ├── Lazy-loaded modal system (13 modals, code-split)
│   ├── Custom hooks layer (20+ hooks)
│   └── Service layer (API, analytics, storage, sync, notifications)
│
├── Local Storage (resilientStorage with backup/recovery)
│
└── Supabase Cloud
    ├── PostgreSQL (20+ tables, RLS policies, PostGIS)
    ├── Auth (email/password, OAuth, profile auto-creation triggers)
    ├── Edge Functions (Deno Deploy)
    │   ├── ai-chat (AI conversation proxy)
    │   ├── create-checkout-session (Stripe integration)
    │   ├── create-portal-session (Stripe customer portal)
    │   └── stripe-webhook (subscription lifecycle events)
    └── Realtime (activity feeds, friend status)
```

### Key Architectural Decisions

**Resilient local storage.** The `dogTaleStorage` utility wraps `localStorage` with automatic backup, corruption detection, and recovery. If primary data fails to parse, the system falls back to a backup copy, logs a recovery event, and continues without data loss. This addresses the real-world problem of localStorage corruption in long-running PWAs.

**Lazy-loaded modal system.** All 13 modals (journal, AI chat, favorites, statistics, keyboard shortcuts, settings, social hub, ASCII visualizer, login, signup, health dashboard, story generator, season pass) are `React.lazy()` imports wrapped in a shared `Suspense` boundary. This keeps the initial bundle focused on the calendar view and defers the cost of feature-rich panels until the user actually opens them.

**Context-driven feature gating.** Four React context providers wrap the application root: `AuthProvider`, `SubscriptionProvider`, `AchievementProvider`, and `ReducedMotionProvider`. The subscription context gates premium features at the component level. The reduced-motion context respects `prefers-reduced-motion` and propagates the preference to all animated components, ensuring WCAG 2.1 AA compliance for vestibular-sensitive users.

**Offline-first with cloud sync.** The app works fully offline using localStorage and the service worker cache. When the user authenticates and goes online, the sync service reconciles local state with the Supabase backend, uploading journal entries, favorites, and settings. This dual-write architecture means users never lose work due to connectivity issues.

---

## Core Feature Set

### Daily Calendar

The primary view is a date-navigable calendar card that fetches a new pet image each day. The `CalendarCard` component integrates breed detection (extracted from the Dog CEO URL pattern), daily content generation (via `src/utils/dailyContent.js`), and inline actions for journaling, AI chat, and favoriting.

Eight visual themes — Park, Beach, Forest, Tundra, Sunset, Night, Snow, Autumn — apply distinct color palettes through Tailwind utility classes. Themes persist across sessions and can be cycled via keyboard shortcut (`T`).

### Journaling

Each day supports a freeform text journal entry keyed by date string. Entries sync bidirectionally between localStorage and the Supabase `journal_entries` table (which supports mood tags, privacy flags, and per-pet attribution). The month calendar view overlays journal indicators on dates that have entries, giving owners a visual record of their engagement.

### Health Dashboard

The health tracking module manages veterinary records across nine categories: vaccination, vet visit, medication, weight, symptom, allergy, surgery, dental, and other. Each record carries optional fields for vet name, clinic, cost, documents, and a `next_due_date` that feeds the reminders system. Reminders support daily, weekly, monthly, and yearly recurrence with push notification integration via the `notificationService`.

### Social Hub

The social layer implements a full social network feature set:

- **Activity Feed** — Posts with four reaction types, comments, and visibility controls (private, friends, public)
- **Friends List** — Bidirectional friendship model with pending/accepted/blocked states
- **Nearby Pet Parents** — PostGIS-powered geospatial queries for proximity discovery
- **Coaching Hub** — Directory of certified trainers with session booking
- **Vet Telemedicine** — 24/7 video consultation integration (premium/luxury tiers)
- **Care Instructions** — Structured daily routines, grooming guides, and health monitoring checklists
- **AR Camera** — Augmented reality filters and accessories for pet photos
- **Pet Memorial** — Memorial pages for deceased pets with tribute messages

### AI Chat

An AI conversation interface, proxied through the `ai-chat` Supabase Edge Function, provides breed-specific Q&A. Usage is rate-limited per subscription tier (5/50/500 messages per day), tracked in the `ai_usage` table, and enforced by a server-side `check_ai_rate_limit()` PostgreSQL function.

### Story Generator

The story modal uses journal entries as seed material to generate personalized narratives about the user's pet, combining AI generation with handcrafted templates from `src/utils/storyTemplates.js`.

---

## Installation and Quick Start

### Prerequisites

- **Node.js** >= 18 (the project uses ES module syntax and Vite 7)
- **npm** or **pnpm** (lockfiles for both are committed)
- A Supabase project (optional — the app works in offline/localStorage-only mode without credentials)

### Setup

```bash
# Clone the repository
git clone https://github.com/organvm-iii-ergon/fetch-familiar-friends.git
cd fetch-familiar-friends

# Install dependencies
npm install

# Copy environment template and configure (optional, for Supabase integration)
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and optionally Stripe keys

# Start the development server (opens http://localhost:3000)
npm run dev
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR on port 3000 |
| `npm run build` | Production build to `dist/` with sourcemaps |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check with zero-warning policy |
| `npm run test` | Run Vitest test suite |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate V8 coverage report |
| `npm run ingest:breeds` | Ingest breed data from external APIs |
| `npm run ingest:breeds:dogs` | Ingest dog breeds only |
| `npm run ingest:breeds:cats` | Ingest cat breeds only |
| `npm run ingest:validate` | Validate ingested breed data |
| `npm run ingest:stats` | Display breed data statistics |
| `npm run process:docs` | Process documentation files |
| `npm run watch:docs` | Watch and auto-process documentation changes |
| `npm run history:parse` | Parse repository history |

### Environment Variables

The `.env.example` file documents all configuration options. The application functions without any environment variables by falling back to public API endpoints and localStorage-only mode:

```
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Supabase anonymous key
VITE_DOG_API_URL=          # Dog CEO API override (default: https://dog.ceo/api)
VITE_CAT_API_URL=          # TheCatAPI override (default: https://api.thecatapi.com/v1)
```

---

## Project Structure

```
fetch-familiar-friends/
├── .github/                     # GitHub community health files and CI/CD
│   ├── workflows/               # 14 GitHub Actions workflows
│   │   ├── ci.yml               # Main CI pipeline
│   │   ├── codeql.yml           # CodeQL security scanning
│   │   ├── deploy-pages.yml     # GitHub Pages deployment
│   │   ├── performance.yml      # Lighthouse CI + bundle analysis
│   │   └── ...                  # Release, stale, label, accessibility workflows
│   ├── ISSUE_TEMPLATE/          # Bug report, feature request, documentation templates
│   ├── DISCUSSION_TEMPLATE/     # Ideas and show-and-tell templates
│   └── dependabot.yml           # Automated dependency updates
├── ios-app/                     # React Native (Expo) iOS companion app
│   ├── src/
│   │   ├── components/          # Native calendar, UI, and theme components
│   │   ├── contexts/            # ThemeContext for native theming
│   │   ├── hooks/               # Dark mode, favorites, journal hooks
│   │   ├── screens/             # Home, Favorites, Journal screens
│   │   ├── services/            # Native image API service
│   │   └── utils/               # Shared utilities (daily content, storage)
│   └── package.json             # Expo + NativeWind dependencies
├── src/                         # Main web application source
│   ├── components/
│   │   ├── calendar/            # CalendarCard, DateNavigation, MonthCalendar, ThemeSelector
│   │   ├── modals/              # 8 modal components (journal, AI, favorites, stats, etc.)
│   │   ├── social/              # 14 social feature components
│   │   ├── health/              # HealthDashboard, HealthOverview, RecordForm, RecordsList
│   │   ├── achievements/        # AchievementNotification, AchievementsPanel
│   │   ├── auth/                # LoginModal, SignupModal
│   │   ├── settings/            # NotificationPreferences
│   │   └── ui/                  # Badge, Button, Card, Input, Skeleton primitives
│   ├── contexts/                # Auth, Subscription, Achievement, ReducedMotion providers
│   ├── hooks/                   # 20+ custom hooks (pets, quests, friends, battles, etc.)
│   ├── services/                # API, analytics, storage, sync, notification, export services
│   ├── utils/                   # Business logic (breed data, date math, pet mechanics, etc.)
│   ├── config/                  # Supabase client, achievement definitions
│   ├── styles/                  # Global CSS with Tailwind + custom design tokens
│   └── test/                    # Test setup, mocks, integration tests
├── supabase/
│   ├── functions/               # 4 Deno Edge Functions (AI chat, Stripe checkout/portal/webhook)
│   └── migrations/              # 3 SQL migrations (schema, battle system, push notifications)
├── scripts/                     # CLI utilities (breed ingestion, doc processing, history parsing)
├── docs/                        # Project documentation (roadmap, technical specs, archive)
├── ChatPRD/                     # Product requirement documents and brainstorming artifacts
├── public/                      # Static assets (SVG fallbacks, manifest, service worker)
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite + Vitest configuration
├── tailwind.config.js           # Tailwind theme extension
└── postcss.config.js            # PostCSS + Autoprefixer
```

---

## Data Model

The Supabase PostgreSQL schema spans 20+ tables organized into five domains. Row-level security (RLS) policies enforce per-user data isolation across all tables.

### Core Domain Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts (extends Supabase Auth) | `xp`, `level`, `streak_days`, `subscription_tier`, `location` (PostGIS) |
| `pets` | Pet profiles (dog, cat, other) | `breed`, `weight_kg`, `is_deceased`, `memorial_message` |
| `pet_photos` | Photo gallery per pet | `url`, `caption`, `is_profile_photo` |

### Engagement Domain

| Table | Purpose |
|-------|---------|
| `journal_entries` | Daily journal (unique per user per date) |
| `favorites` | Saved images (unique per user per URL) |
| `activities` | Activity feed posts with 14 activity types |
| `activity_reactions` | Four reaction types per post |
| `comments` | Threaded comments on activities |
| `friendships` | Bidirectional friend model (pending/accepted/blocked) |

### Gamification Domain

| Table | Purpose |
|-------|---------|
| `user_progress` | Generic progress counters |
| `achievements` | Unlocked badges (60+ definitions) |
| `quests` | Daily/weekly/seasonal/story quests with expiry |
| `virtual_pets` | Tamagotchi-style pet (happiness, energy, hunger, XP) |
| `season_pass` | Seasonal progression with premium track |

### Health Domain

| Table | Purpose |
|-------|---------|
| `health_records` | Nine record types (vaccination, medication, weight, etc.) |
| `reminders` | Recurring care reminders with push notification flag |

### AI Domain

| Table | Purpose |
|-------|---------|
| `ai_conversations` | Conversation containers |
| `ai_messages` | Individual messages (user/assistant/system roles) |
| `ai_usage` | Daily rate-limit counters per user |

Server-side PostgreSQL functions handle XP calculation with leveling (`add_user_xp`), streak management (`update_user_streak`), and AI rate limiting (`check_ai_rate_limit`, `increment_ai_usage`).

---

## API Integrations

### Image APIs

The `imageApi` service (`src/services/imageApi.js`) centralizes all external image fetching with production-grade resilience:

- **Rate limiting** — 50 requests per minute, tracked with a sliding window
- **Retry logic** — Exponential backoff (1s, 2s, 4s) with up to 3 retry attempts
- **Timeout handling** — 10-second AbortController timeout per request
- **Fallback images** — SVG fallbacks in `/public/` when all retries fail
- **Breed extraction** — Parses breed names from Dog CEO URL patterns (e.g., `/breeds/labrador-retriever/` becomes "Labrador Retriever")

Two providers are currently integrated:

| Provider | Endpoint | Content |
|----------|----------|---------|
| [Dog CEO](https://dog.ceo/dog-api/) | `dog.ceo/api/breeds/image/random` | Random and breed-specific dog images |
| [TheCatAPI](https://thecatapi.com/) | `api.thecatapi.com/v1/images/search` | Random cat images with optional breed metadata |

### Supabase Edge Functions

Four Deno-based edge functions handle server-side operations:

| Function | Purpose |
|----------|---------|
| `ai-chat` | Proxies AI conversation requests, enforces rate limits |
| `create-checkout-session` | Creates Stripe checkout sessions with customer management |
| `create-portal-session` | Opens Stripe customer portal for subscription management |
| `stripe-webhook` | Processes Stripe webhook events for subscription state sync |

---

## Gamification Engine

The achievement system defines 60+ achievements across eight categories: Journal, Social, Collection, Gamification, Pet Care, Streak, Season, and Special. Each achievement has a rarity tier (Common, Uncommon, Rare, Epic, Legendary) with XP multipliers (1x through 5x).

### Achievement Categories

| Category | Example Achievements | Trigger |
|----------|---------------------|---------|
| **Journal** | First Steps, Chronicle Legend | `journal_count` thresholds (1 to 365) |
| **Social** | New Friend, Pet Celebrity, Viral Sensation | `friend_count`, `reactions_given`, `max_reactions_on_post` |
| **Collection** | Breed Novice through Breed Encyclopedia | `breed_count` (10 to 150) |
| **Gamification** | Quest Rookie through Quest Legend, Gym Champion | `quests_completed`, `gyms_conquered`, `battles_won` |
| **Pet Care** | Pet Parent, Health Champion | `pet_count`, `health_records` |
| **Streak** | Day Starter through Year Legend | `login_streak` (3 to 365 days) |
| **Season** | Season Starter through Season Champion | `season_level` (5 to 50) |
| **Special** | Early Bird, Night Owl, First Anniversary | Hidden achievements with time-based triggers |

The `AchievementContext` provider evaluates triggers on each relevant state change and surfaces toast notifications via the `AchievementNotificationContainer`.

### Virtual Pet

A Tamagotchi-inspired virtual pet system tracks happiness, energy, and hunger with time-based decay. Users feed, play with, and rest their virtual pet to maintain wellbeing. The pet gains XP and levels up, unlocking customization options. State persists locally and syncs to the `virtual_pets` table when authenticated.

### Quests and Season Pass

Daily, weekly, seasonal, and story quests provide structured goals with XP rewards. The season pass adds a 50-level progression track with free and premium reward tiers, resetting each season.

---

## Subscription and Monetization

The Stripe integration follows a secure server-side pattern:

1. **Checkout** — The client calls the `create-checkout-session` edge function, which creates or retrieves a Stripe customer, builds a checkout session with the selected price ID, and returns the hosted checkout URL.
2. **Fulfillment** — The `stripe-webhook` edge function listens for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` events, updating the `profiles.subscription_tier` and `profiles.subscription_expires_at` fields accordingly.
3. **Portal** — The `create-portal-session` edge function lets authenticated users manage billing, upgrade/downgrade plans, and cancel subscriptions through Stripe's hosted portal.

The `SubscriptionContext` on the client side reads the user's tier from the profile and gates premium features at the component level, showing upgrade prompts for restricted functionality.

---

## Testing

The test suite uses Vitest with Happy DOM for fast, Node-native DOM simulation.

```bash
# Run all tests
npm run test

# Run with browser-style UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage Areas

- **Unit tests** — `dailyContent`, `dateUtils`, `dataValidation`, `dataFreshness`, `imageCache`, `resilientStorage`, `storageMonitor`, `useReducedMotion`
- **Component tests** — `MonthCalendar`, `AiModal`, `ActivityFeed`, `FriendsList`, `GameplayHub`, `Leaderboards`, `VirtualPet`
- **Hook tests** — `useActivityFeed`, `useFriends`, `useQuests`
- **Integration tests** — Auth flow, gamification progression
- **Service tests** — `imageApi` (rate limiting, retry, fallback behavior)

The CI pipeline (`.github/workflows/ci.yml`) runs lint, type checking, and the full test suite on every push and pull request. CodeQL scanning and Dependabot are configured for ongoing security monitoring.

---

## Scripts and Tooling

### Breed Data Ingestion

The `scripts/ingestBreedData.js` CLI tool fetches, normalizes, and caches breed data from the Dog CEO and TheCatAPI services. It supports selective ingestion (`--dogs`, `--cats`), validation (`--validate`), and statistics reporting (`--stats`). Ingested data feeds the breed knowledge utility (`src/utils/breedKnowledge.js`) used by the daily content generator and AI chat context.

### Document Processing

The `scripts/processDocuments.js` and `scripts/watchDocuments.js` tools manage the project's extensive documentation corpus (ChatPRD specs, roadmaps, technical docs). The watcher uses `chokidar` to auto-process documentation changes during development.

### History Parser

The `scripts/historyParser.js` tool parses repository commit history into structured data for the `HISTORICAL_MANIFEST.json`, providing a machine-readable record of the project's evolution.

---

## Cross-Organ References

Fetch Familiar Friends operates within the broader eight-organ creative-institutional system:

| Organ | Relationship |
|-------|-------------|
| **ORGAN-I (Theoria)** | The [recursive-engine](https://github.com/organvm-i-theoria/recursive-engine) provides the epistemological framework for self-referential system design that informs how this app's gamification loop references itself (achievements about achievements, quests about quests). |
| **ORGAN-II (Poiesis)** | The [metasystem-master](https://github.com/organvm-ii-poiesis/metasystem-master) generative art system shares the same philosophy of daily creative output that drives the daily calendar ritual. |
| **ORGAN-IV (Taxis)** | The [agentic-titan](https://github.com/organvm-iv-taxis/agentic-titan) orchestration framework may eventually govern cross-product analytics and shared user identity across ORGAN-III products. |
| **ORGAN-V (Logos)** | The [public-process](https://github.com/organvm-v-logos/public-process) repository documents the building-in-public journey, including essays on consumer app development decisions made in this project. |
| **ORGAN-VII (Kerygma)** | Marketing and POSSE distribution of launch announcements, feature highlights, and user testimonials. |

Within ORGAN-III itself, this repository represents the B2C consumer product line. Sibling repositories cover B2B tools ([public-record-data-scrapper](https://github.com/organvm-iii-ergon/public-record-data-scrapper)), browser extensions ([tab-bookmark-manager](https://github.com/organvm-iii-ergon/tab-bookmark-manager)), and internal infrastructure.

---

## Roadmap

The project roadmap is maintained in [`ROADMAP.md`](ROADMAP.md) and [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md). Key upcoming milestones:

- **iOS companion app** — The `ios-app/` directory contains an in-progress React Native (Expo) port with NativeWind styling, targeting TestFlight distribution.
- **Push notifications** — The third Supabase migration (`003_push_notifications.sql`) prepares the schema for Web Push and APNs integration.
- **Battle system expansion** — The second migration (`002_battle_system.sql`) adds PvP matchmaking infrastructure. The client-side hooks (`useGymBattles`, `useBattleQueue`) are implemented and awaiting backend activation.
- **Data export** — The `exportService` supports JSON and CSV export of journal entries, favorites, and health records for data portability compliance.
- **Accessibility audit** — The [`ACCESSIBILITY.md`](ACCESSIBILITY.md) document tracks WCAG 2.1 AA compliance. The `ReducedMotionProvider` is already deployed; remaining work covers screen reader optimization and keyboard navigation for all social features.

---

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on branching, commit messages, and pull request format.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make changes and ensure `npm run lint` and `npm run test` pass
4. Submit a pull request using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)

All code changes require passing CI (lint + tests + CodeQL) before merge. The project uses automated PR labeling, size detection, and reviewer assignment via the `.github/workflows/pr-automation.yml` workflow.

### Community Resources

- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Security Policy](.github/SECURITY.md)
- [Support Guide](.github/SUPPORT.md)
- [Governance](.github/GOVERNANCE.md)

---

## License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for the full text.

---

## Author

**[@4444j99](https://github.com/4444j99)**

Part of [ORGAN-III: Ergon](https://github.com/organvm-iii-ergon) — the commerce organ of the [ORGANVM](https://github.com/meta-organvm) eight-organ creative-institutional system.
