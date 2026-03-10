# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DogTale Daily is a React-based daily dog/cat calendar app with personalized content, journaling, and social features. Users view daily pet images (from dog.ceo and thecatapi.com APIs), track favorites, write journal entries, and interact with various modals.

## Development Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build to dist/
npm run lint         # ESLint (zero warnings allowed)
npm run test         # Run Vitest tests
npm run test:ui      # Vitest with UI
npm run test:coverage # Coverage report
```

### Data Scripts
```bash
npm run ingest:breeds        # Ingest all breed data
npm run ingest:breeds:dogs   # Dogs only
npm run ingest:breeds:cats   # Cats only
npm run ingest:validate      # Validate breed data
npm run ingest:stats         # Show breed statistics
```

## Architecture

### Core Application Flow
- `src/index.jsx` → `src/App.jsx` (main state container)
- App.jsx manages all modal states, user data (favorites, journal entries, settings), and persists to localStorage with `dogtale-*` keys
- Dark mode managed via `useDarkMode` hook with system preference detection

### Component Structure
- **Calendar components** (`src/components/calendar/`): CalendarCard (main daily view with dog/cat flip), DateNavigation, MonthCalendar, ThemeSelector
- **Modals** (`src/components/modals/`): Journal, AI chat, Favorites, Statistics, Settings, ASCII guide, SocialHub, KeyboardShortcuts
- All modals use a shared `Modal.jsx` base component

### Key Patterns
- **Image caching**: `src/utils/imageCache.js` caches API responses by date, supports preloading nearby dates
- **Daily content**: `src/utils/dailyContent.js` uses seeded random to generate consistent facts/moods/quotes per date
- **Keyboard shortcuts**: `src/hooks/useKeyboardShortcuts.js` provides navigation (arrows, h/l vim-style), modal toggles (j/a/f/s), theme cycling (Ctrl+Shift+T)
- **Data validation**: `src/utils/dataValidation.js` and `dataFreshness.js` for breed data integrity

### External APIs
- Dog images: `https://dog.ceo/api` (configurable via `VITE_DOG_API_URL`)
- Cat images: `https://api.thecatapi.com/v1` (configurable via `VITE_CAT_API_URL`)

### Styling
- Tailwind CSS with custom classes in `src/styles/globals.css`:
  - `.glass-effect` - frosted glass UI
  - `.rounded-custom` / `.rounded-custom-lg` - consistent border radius
  - `.preserve-3d` - 3D card flip animations
- 8 themes available: park, beach, forest, tundra, sunset, night, snow, autumn

## Testing

Tests use Vitest with happy-dom environment. Test files are colocated with source (e.g., `dailyContent.test.js`).

Setup file at `src/test/setup.js` provides:
- localStorage mock
- window.matchMedia mock
- @testing-library/jest-dom matchers

Run a single test file:
```bash
npx vitest run src/utils/dailyContent.test.js
```

## Code Conventions

- Functional components with hooks (no class components)
- PropTypes validation on all components (though eslint rule is disabled)
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Framer Motion for animations

## Deployment

Live at **https://fetch-familiar-friends.netlify.app** (Netlify, `main` branch auto-deploys).

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-III (Commerce) | **Tier:** standard | **Status:** PUBLIC_PROCESS
**Org:** `organvm-iii-ergon` | **Repo:** `fetch-familiar-friends`

### Edges
- **Produces** → `unspecified`: product
- **Produces** → `organvm-vi-koinonia/community-hub`: community_signal
- **Produces** → `organvm-vii-kerygma/social-automation`: distribution_signal

### Siblings in Commerce
`classroom-rpg-aetheria`, `gamified-coach-interface`, `trade-perpetual-future`, `sovereign-ecosystem--real-estate-luxury`, `public-record-data-scrapper`, `search-local--happy-hour`, `multi-camera--livestream--framework`, `universal-mail--automation`, `mirror-mirror`, `the-invisible-ledger`, `enterprise-plugin`, `virgil-training-overlay`, `tab-bookmark-manager`, `a-i-chat--exporter`, `.github` ... and 12 more

### Governance
- Strictly unidirectional flow: I→II→III. No dependencies on Theory (I).

*Last synced: 2026-03-08T20:11:34Z*

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |
| unknown | any | gpt-to-os | SOP_GPT_TO_OS.md |
| unknown | any | index | SOP_INDEX.md |
| unknown | any | obsidian-sync | SOP_OBSIDIAN_SYNC.md |

Linked skills: evaluation-to-growth


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Task Queue (from pipeline)

**4** pending tasks | Last pipeline: unknown

- `48fb8f17ac15` Analyze Current Layout:
- `c319c3d5b62f` Implement Masonry Layout in `ActivityFeed.jsx`:
- `1f05b6107c5f` Update `ActivityItem` inside `ActivityFeed.jsx`:
- `00ead5e3ac99` Verify Implementation:

Cross-organ links: 115 | Top tags: `bash`, `typescript`, `react`, `terraform`, `mcp`

Run: `organvm atoms pipeline --write && organvm atoms fanout --write`

<!-- ORGANVM:AUTO:END -->


## ⚡ Conductor OS Integration
This repository is a managed component of the ORGANVM meta-workspace.
- **Orchestration:** Use `conductor patch` for system status and work queue.
- **Lifecycle:** Follow the `FRAME -> SHAPE -> BUILD -> PROVE` workflow.
- **Governance:** Promotions are managed via `conductor wip promote`.
- **Intelligence:** Conductor MCP tools are available for routing and mission synthesis.
