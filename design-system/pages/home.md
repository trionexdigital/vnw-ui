# Home Page Override

This file overrides `design-system/MASTER.md` only for the home-page hero.

## Hero composition

- Use a light, luxury storefront treatment with the official purple-and-gold logo unchanged.
- Desktop mirrors the approved supplied reference: editorial promotional copy, pill trust cues, two actions, and a live-metric panel on the left; a larger gold orbital brand stage on the right.
- Mobile preserves semantic reading order: copy and metrics first, compact artwork second.
- At laptop heights up to 900px, the complete hero must fit beneath the public header without page-level scrolling; scale the artwork and headline before removing content.
- Keep the hero content close to the public header with one compact desktop spacing step, and allow the right-side artwork to carry slightly more visual weight than the copy column.
- The official slogan sits flush toward the lower edge of the artwork in an opaque gold-edged plaque, layered above the pedestal and below the central logo chamber.
- The hero is a brand showcase. Search remains available in the public header and marketplace sections below.
- The primary hero and Register actions may use the official purple gradient shown in the approved reference; this exception is limited to those two brand conversion controls.

## Public header reference

- Use the supplied reference header: large official logo lockup, unboxed desktop navigation, warm active Home state, gold-outline Search, three square utility controls, bordered Sign In, and purple Register.
- At the top of the page, the fixed header has no outer gap, border, corner radius, or shadow. Its warm-white/gold surface joins the hero as one continuous page.
- The top-state header overlaps the hero seam by one device pixel and has no reserved transparent border, preventing a visible horizontal divider at fractional zoom levels.
- After the user scrolls 16px, the header becomes a floating footer-style glass panel with a subtle stone border, `1.5rem` corner radius, white surface, restrained shadow, and compact side inset.
- Keep the header at a constant 72px footprint in both states so the visual elevation change never reflows the page.
- At desktop widths, all six navigation destinations, Search, utility controls, Sign In, and Register remain visible together; compact padding and typography before hiding controls.
- Preserve the responsive mobile drawer and all existing header routes/count badges.

## Managed carousel

- Render the admin-managed carousel immediately after the hero and before marketplace discovery sections.
- Normalize every uploaded image through the admin crop workflow to a fixed `16:5` frame at `1600 × 500px`; accept JPG, PNG, or WebP sources that are at least `1200 × 375px`.
- Only active slides with valid images appear publicly, ordered by `sort_order` and then `banner_id`.
- Provide previous/next controls, slide indicators, touch dragging, and an explicit autoplay pause control. Pause automatic progression during pointer or keyboard interaction and disable it for reduced motion.
- Carousel loading and API failure remain isolated from hero metrics, listings, categories, and other homepage data.
- Admin add, edit, publish/hide, order, crop, replace, and delete operations remain protected by the database-verified `ADMIN` role.

## Approved motion exception

- The hero may use one localized mechanical motion system: slowly rotating gold orbit tracks, counter-rotating VIP-number plaques that remain upright, a reverse-moving tick ring, and subtle light particles.
- Numeric butterflies use one shared wing, body, typography, and flutter system across the header and hero. They may fly across both as a very-low-opacity ambient layer, while a synchronized opaque layer is clipped to the open space of the right artwork region so they become fully visible only inside the approved highlighted area.
- Butterfly flight never intercepts pointer events; the copy column keeps only the subdued ambient treatment while the orbital stage remains above the flock.
- Motion must use transform and opacity only, pause while the hero is outside the viewport, and become static when `prefers-reduced-motion` is enabled.
- Never use strobing, rapid contrast flashes, scroll-jacking, or motion on text and metrics after their initial reveal.
- This exception does not re-enable continuous decorative animation anywhere else in the application.

## Live proof

- Metrics must come from the public hero-stats API and must never use invented fallback numbers.
- If the API is unavailable, show the nonnumeric trust statements: Verified listings, Secure purchase, and Pan-India support.
