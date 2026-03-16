## Goal
Make the site background feel consistent across all pages and sections while keeping the dark premium style.

## Problem
The current fixed radial body gradient looks good at the top of the page, but clashes with section overlays and creates inconsistent transitions while scrolling.

## Approach (Option B, Neutral)
- Use a stable base background color for `html`/`body` (`--bg`).
- Add a subtle, fixed ambient gradient layer using `body::before` with low-contrast neutral blue/gray tones.
- On smaller screens, switch the ambient layer to `position: absolute` to reduce potential fixed-background jank.

## Success Criteria
- Background feels cohesive across all pages.
- Scrolling between sections does not reveal harsh gradient seams.
- No impact on layout or interactions (overlay is non-interactive and behind content).
