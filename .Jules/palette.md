## 2024-05-22 - Initial Setup
**Learning:** Found detached labels in JournalModal and SettingsModal. Explicit association or wrapping is required for accessibility.
**Action:** Always check form inputs for proper label association using 'htmlFor'/'id' or nesting.

## 2024-05-22 - Chat Accessibility
**Learning:** Chat message containers need `role="log"` and `aria-live="polite"` to be announced by screen readers. Purely visual typing indicators are invisible to AT users without `role="status"` and sr-only text.
**Action:** Always wrap dynamic message lists in a region with `role="log"` and ensure status indicators have text alternatives.
