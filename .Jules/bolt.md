
## 2026-01-21 - Calendar Performance Optimization
**Learning:** Optimizing render loops in grid-based components (like calendars) provides significant wins. Memoizing the individual cell component (`CalendarDay`) prevents ~40 unnecessary re-renders when a single day is selected. Additionally, converting array-based lookups (O(N*M)) to Set-based lookups (O(N)) inside the render loop drastically reduces computational overhead.
**Action:** When working with list or grid renderings, always check for:
1. Lookup complexity inside the map loop (prefer Sets over Arrays).
2. Child component stability (memoize items if parent re-renders frequently but items don't).
