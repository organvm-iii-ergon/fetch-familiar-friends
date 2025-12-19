## 2024-05-22 - Focus Management in Modals
**Learning:** React Portals and Modals often disconnect the DOM structure from the visual structure, leading to accessibility issues where keyboard focus can 'leak' out of the modal into the background content.
**Action:** Implement a 'Focus Trap' using 'useEffect' to listen for Tab keys. Always verify that focus cycles correctly (First -> Last -> First) and that initial focus is set to a meaningful element inside the modal.
**Refinement:** Ensure the focus trap logic explicitly filters out disabled elements, as browsers skip them during tab navigation, which can break the cycle logic if the first/last element is disabled.
