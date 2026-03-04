# Objective
Implement a multi-column masonry layout for the `ActivityFeed` component to better accommodate varying post heights (text-only vs. image-heavy posts) and improve screen utilization on larger viewports.

# Key Files & Context
- `src/components/social/ActivityFeed.jsx`: The main feed component where the layout logic will be updated.
- `src/components/social/ActivityFeed.test.jsx`: Existing tests to be updated for the new layout.
- `src/test/repro/ActivityFeedLayout.test.jsx`: Reproduction test to verify the layout change.

# Implementation Steps
1. **Analyze Current Layout**:
   - The current implementation uses a single-column layout with `space-y-4` for vertical spacing.
   - Posts are rendered inside an `AnimatePresence` wrapper.

2. **Implement Masonry Layout in `ActivityFeed.jsx`**:
   - Wrap the `AnimatePresence` and activity mapping in a container with CSS column classes:
     - `columns-1 sm:columns-2 lg:columns-3`: Responsive column counts.
     - `gap-4`: Horizontal and vertical spacing between columns.
     - `space-y-4`: Maintain vertical spacing within columns (standard behavior for CSS columns).
   - Add `break-inside-avoid-column` to the `ActivityItem` wrapper (or the `motion.div` within it) to prevent post cards from splitting across columns.
   - Ensure `mb-4` is applied to each activity item to maintain vertical rhythm in the masonry flow.

3. **Update `ActivityItem` inside `ActivityFeed.jsx`**:
   - The `ActivityItem` is currently defined within the same file.
   - Update the `motion.div` in `ActivityItem` to include `break-inside-avoid-column mb-4`.

4. **Verify Implementation**:
   - Update `src/test/repro/ActivityFeedLayout.test.jsx` to assert the presence of masonry layout classes.
   - Run existing tests `src/components/social/ActivityFeed.test.jsx` to ensure no regressions in functionality.

# Verification & Testing
- **Unit Tests**:
  - `npm run test src/components/social/ActivityFeed.test.jsx`
  - `npm run test src/test/repro/ActivityFeedLayout.test.jsx`
- **Manual Check (Aesthetics)**:
  - Verify that cards do not split between columns.
  - Verify responsive behavior (1 column on mobile, 2 on tablet, 3 on desktop).
  - Ensure the "Recent Activity" header and the refresh/create buttons remain aligned correctly above the grid.
