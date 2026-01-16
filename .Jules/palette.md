# Palette's Journal

## 2024-05-22 - AI Chat Accessibility
**Learning:** Chat interfaces often fail WCAG compliance because new messages aren't announced by screen readers.
**Action:** Always use `role="log"` with `aria-live="polite"` for chat containers, and ensure typing indicators have `role="status"`.
