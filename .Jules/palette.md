## 2024-05-22 - Initial Setup
**Learning:** Found detached labels in JournalModal and SettingsModal. Explicit association or wrapping is required for accessibility.
**Action:** Always check form inputs for proper label association using 'htmlFor'/'id' or nesting.

## 2025-05-27 - Reduced Motion
**Learning:** Initializing state based on `window.matchMedia('(prefers-reduced-motion: reduce)')` is a simple way to respect user OS preferences by default.
**Action:** When adding animation flags, always check `prefers-reduced-motion` for the default value.
