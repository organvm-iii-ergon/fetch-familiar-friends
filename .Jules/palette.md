## 2024-05-22 - Initial Setup
**Learning:** Found detached labels in JournalModal and SettingsModal. Explicit association or wrapping is required for accessibility.
**Action:** Always check form inputs for proper label association using 'htmlFor'/'id' or nesting.

## 2025-02-18 - AI Chat Accessibility
**Learning:** Dynamic chat interfaces require `role="log"` and `aria-live="polite"` for screen readers to announce new messages. Visual-only typing indicators are invisible to AT users.
**Action:** Use `role="log"` for chat containers and `role="status"` with `sr-only` text for typing indicators.
