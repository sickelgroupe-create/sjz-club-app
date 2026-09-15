# Frontend UI freeze

The user-approved frontend visual design is frozen.

- Treat `tests/visual-round-2/*.png` as the canonical visual baseline. The profile-page baseline is `tests/visual-round-2/05-profile.png`.
- Do not redesign, restyle, rearrange, replace, simplify, or regenerate frontend UI unless the user explicitly asks for a new visual change.
- Do not modify Vue templates, scoped/global styles, shared UI components, icons, images, navigation layout, spacing, typography, colors, radii, shadows, or responsive behavior for backend/API/business tasks.
- Business work may modify page `<script>` blocks, `services/**`, request handling, state, validation, and data mapping as long as the rendered design remains unchanged.
- A bug fix may touch frozen UI only when it restores the approved baseline. Keep that change as small as possible and verify it visually.
- Before and after frontend business changes, run `npm run check:ui-freeze`. A failure is a blocker, not a manifest-update request.
- Never run `node scripts/check-ui-freeze.mjs --write` unless the user has explicitly authorized changing the frontend UI baseline in the current request.
- Preserve the H5 `navigator` compatibility rule on the profile ranking card; removing it breaks the approved horizontal layout.

