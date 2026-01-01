## 2024-05-23 - AiModal Input Validation and Sanitization
**Vulnerability:** The AI chat input lacked profanity filtering despite memory logs claiming it existed. Additionally, the existing `isFamilyFriendly` utility used naive substring matching, leading to false positives (e.g., flagging "hello" because of "hell").
**Learning:** Never assume security controls exist based on documentation or memory logs alone; always verify implementation. Naive string matching for profanity filters is prone to "clbuttic" errors (Scunthorpe problem).
**Prevention:**
1. Always verify security controls in the actual code path (`handleSend` in this case).
2. Use word boundaries (`\b`) or more sophisticated libraries for keyword filtering to avoid false positives.
3. Added `react-dom` version pinning to resolve peer dependency issues impacting test reliability.
