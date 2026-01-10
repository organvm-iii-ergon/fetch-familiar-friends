## 2024-05-22 - Initial Setup
**Learning:** Found detached labels in JournalModal and SettingsModal. Explicit association or wrapping is required for accessibility.
**Action:** Always check form inputs for proper label association using 'htmlFor'/'id' or nesting.

## 2026-01-10 - Chat Interface Accessibility
**Learning:** Chat messages in a simple div are invisible to screen readers as they arrive. `role="log"` with `aria-live="polite"` is essential for dynamic chat updates.
**Action:** Always wrap chat message lists in a container with `role="log"`, `aria-live="polite"`, and `aria-atomic="false"`.
