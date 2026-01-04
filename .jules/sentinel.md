## 2024-05-24 - [Regex Word Boundaries in Profanity Filters]
**Vulnerability:** The profanity filter used simple substring matching (`includes()`), causing "Scunthorpe problem" false positives (e.g., blocking "hello" because it contains "hell"). This degrades availability/usability, which is a security concern (DoS/User Trust).
**Learning:** Simple substring matching is too aggressive for content moderation.
**Prevention:** Use Regular Expressions with word boundaries (`\b`) to match whole words only, ensuring legitimate words containing substrings of profane words are not blocked.

## 2024-05-24 - [Defense in Depth for AI Chat]
**Vulnerability:** The AI Chat component (`AiModal.jsx`) trusted user input implicitly before adding it to the local message history state, lacking both sanitization and validation layers.
**Learning:** Even if data isn't sent to a server immediately, sanitizing and validating input at the entry point (the UI component) prevents bad data from polluting the application state and provides immediate feedback to the user.
**Prevention:** Implement input validation (profanity check) and sanitization (HTML encoding) directly in the event handler before updating component state.
