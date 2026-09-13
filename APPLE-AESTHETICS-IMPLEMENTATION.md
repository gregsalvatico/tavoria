# Tavoria Apple-Inspired UI Track

This is a second implementation list. The existing product and profile work remains in `PLAN.md` and the current codebase. This track changes the interface language without changing Tavoria's product model or identity.

## Design guardrails

- Keep Tavoria's paper background, navy structure, orange action color, Instrument Serif display type, Hanken Grotesk interface type, and DM Mono labels.
- Use Apple-like clarity, restraint, hierarchy, alignment, readable type, and predictable interaction states.
- Prefer calm surfaces and separators over nested cards, heavy shadows, gradients, decorative blobs, or oversized hero blocks.
- Keep one clear primary action per view. Secondary actions should be quiet links, icon buttons, or compact outline controls.
- Keep touch targets at least 44px, visible focus/pressed states, strong contrast, and labels that work without color alone.
- Preserve the existing mobile flows and desktop sidebar behavior while making both feel like the same product.

## Implementation order

### 1. Shared visual foundations — complete

- Centralize Tavoria color, spacing, radius, border, shadow, and typography tokens.
- Define a small surface vocabulary: page, grouped list, elevated sheet, selected, disabled, and destructive.
- Normalize heading, body, label, caption, and metadata styles across worker and venue screens.
- Replace one-off dark gray, white, and orange values in shared components with the tokens.

### 2. Navigation and app chrome — complete

- Refine the desktop sidebar into a quiet navigation rail with clear active state, profile destination, and role-aware links.
- Refine mobile bottom navigation with consistent icon size, label spacing, selected color, and safe-area handling.
- Make page headers consistent: back action, title, optional context, and one trailing action.
- Keep the Tavoria wordmark and orange `T` as the strongest brand signal instead of adding decorative chrome.

### 3. Buttons and controls — complete

- Create shared primary, secondary, quiet-link, icon, destructive, and loading button primitives.
- Normalize button height, horizontal padding, icon placement, text baseline, disabled opacity, and loader placement.
- Use familiar icons for icon-only actions and accessible labels/tooltips for desktop.
- Normalize inputs, segmented filters, tabs, switches, and disclosure rows with the same focus and pressed states.

### 4. Lists and surfaces

- Convert repeated card stacks into grouped list rows with separators and limited elevation.
- Keep cards only for media, modals, genuinely grouped content, and high-priority status blocks.
- Use consistent row heights, thumbnail ratios, trailing chevrons, and metadata alignment.
- Remove duplicate labels and decorative copy that slows scanning.

### 5. Worker experience

- Apply the profile hierarchy already started: identity first, primary profile image separate from other media, facts next, then optional details.
- Simplify worker directory rows so matching signal, role, city, availability, and media presence are immediately scannable.
- Make worker media editing feel like a native media-management surface with clear primary/additional media roles.
- Keep matching order and recommendation logic unchanged while improving its presentation.

### 6. Venue experience

- Apply the same profile hierarchy to venue identity, profile media, key information, and shifts.
- Make the venue board place venue identity above shifts without competing with the first available action.
- Present candidate browsing as a calm, ranked list with one obvious next action per candidate.
- Keep venue paywall and founder access logic unchanged; improve only the visual explanation and action hierarchy.

### 7. Core flows

- Rework sign in, sign up, profile editing, posting a shift, applying, and contact flows around short focused steps.
- Use bottom action areas consistently on mobile and desktop, with no extra padding or stacked desktop actions.
- Replace large explanatory blocks with concise context placed directly beside the related action.
- Keep all existing translations and add missing strings before changing visible copy.

### 8. Sheets, modals, and feedback

- Standardize modal width, corner radius, close control, backdrop, internal padding, and button order.
- Use sheets for focused choices and confirmations; keep the page visible behind them where appropriate.
- Add consistent loading, empty, error, retry, success, and optimistic states.
- Ensure loaders never replace button labels; place them beside the action text.

### 9. Responsive and accessibility pass

- Validate every shared component at mobile, tablet, and wide desktop widths.
- Remove accidental max-width, horizontal padding, footer gaps, and overflow from shared wrappers.
- Verify keyboard focus, readable contrast, screen-reader labels, hit targets, and reduced-motion behavior.
- Check that text never overlaps or causes buttons and footers to resize unexpectedly.

### 10. Verification and rollout — complete

- Capture a route inventory for worker and venue roles before each visual batch.
- Run TypeScript, focused logic tests, `git diff --check`, and a production web build.
- Review representative screenshots for landing, auth, home, directory, profiles, shift detail, edit flows, and modals. Automated build validation is complete; final manual screenshot review remains a browser QA task.
- Ship in small batches: foundations, navigation/controls, worker surfaces, venue surfaces, then flow polish.
