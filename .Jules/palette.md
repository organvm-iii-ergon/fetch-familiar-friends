## 2024-05-22 - Initial Setup
**Learning:** Found detached labels in JournalModal and SettingsModal. Explicit association or wrapping is required for accessibility.
**Action:** Always check form inputs for proper label association using 'htmlFor'/'id' or nesting.

## 2024-05-24 - Chat Accessibility
**Learning:** Chat interfaces require specific ARIA roles (`role="log"`, `aria-live="polite"`) to be usable by screen readers. Visual-only status indicators (like typing dots) must have text equivalents (`role="status"` + `sr-only`).
**Action:** Apply `role="log"` to dynamic message containers and ensure all status animations have hidden text descriptions.
