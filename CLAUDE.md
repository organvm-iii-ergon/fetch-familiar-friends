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
