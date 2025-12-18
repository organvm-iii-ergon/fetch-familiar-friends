# Bolt's Journal

This file contains critical learnings and insights from Bolt's performance optimization work.

## 2025-05-15 - React Component Optimization
**Learning:** `React.memo` is only effective if the props passed to the component are stable. Inline arrow functions (e.g., `onClick={() => ...}`) create new references on every render, defeating the purpose of memoization.
**Action:** Always wrap callback props in `useCallback` when passing them to memoized components. Also, defining static data outside the component prevents recreation.
