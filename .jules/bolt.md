# Bolt's Journal

This file contains critical learnings and insights from Bolt's performance optimization work.

## 2025-05-15 - React Component Optimization
**Learning:** `React.memo` is only effective if the props passed to the component are stable. Inline arrow functions (e.g., `onClick={() => ...}`) create new references on every render, defeating the purpose of memoization.
**Action:** Always wrap callback props in `useCallback` when passing them to memoized components. Also, defining static data outside the component prevents recreation.

## 2025-05-15 - Date Lookup Optimization
**Learning:** Performing date conversions (e.g., `new Date(timestamp).toDateString()`) inside a render loop (like a calendar grid) is an expensive O(N) operation.
**Action:** Pre-calculate date strings into a `Set` using `useMemo` outside the render loop. This transforms the complexity from O(N*Cells) to O(N) + O(1) lookup. Also, ensure consistent date key formats (YYYY-MM-DD) to avoid legacy `toDateString()` mismatches.
