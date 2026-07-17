# VIP Number World Master Design System

Status: Master source of truth  
Product: Premium VIP mobile-number marketplace  
Theme policy: System, light, and dark
Stack: React, TypeScript, Vite, Tailwind CSS, Radix/shadcn-style primitives, Lucide icons

## 1. Design Intent

VIP Number World must feel premium, trustworthy, fast, and commercially clear. The product is a telecom and e-commerce marketplace, not a luxury fashion landing page. The interface should help users search, compare, trust, and buy VIP mobile numbers with minimal friction.

Primary design qualities:

- System-aware interface with explicit light and dark overrides.
- Clean white/warm-neutral light surfaces and warm-charcoal dark surfaces.
- Deep charcoal text in light mode and warm ivory text in dark mode.
- Restrained gold brand accent.
- Professional telecom and e-commerce appearance.
- Search-first shopping experience.
- Mobile-first responsive behavior.
- High contrast, visible focus states, clear labels, and accessible touch targets.
- Operational dashboards that prioritize scanning, filtering, and action speed.

Do not introduce:

- Pure black surfaces; dark mode uses the warm-charcoal semantic palette.
- Isolated dark sections that ignore the selected application theme.
- Purple or magenta gradients.
- Excessive glassmorphism.
- Excessive blur effects.
- Continuous decorative animations.
- Oversized rounded cards.
- Emoji-based UI icons.
- Raw one-off colors inside page components when semantic tokens exist.

## 2. Design Language Split

### Customer Storefront

Use a premium and spacious marketplace style.

Core behavior:

- Search is the primary conversion action.
- Product cards must make number, price, availability, and CTA obvious.
- Trust cues must be visible but quiet.
- Content should feel curated, not flashy.
- Home, shop, number detail, cart, checkout, auth, static pages, wishlist, compare, referrals, and sell-number flows use this language.

Visual character:

- White and warm-neutral surfaces.
- Gold used for brand emphasis, premium badges, highlights, and secondary accent.
- Primary actions use deep charcoal or accessible gold, depending on context.
- Cards are clean, bordered, and lightly elevated.
- Motion is subtle and functional.

### Admin, Dealer, and Employee Dashboards

Use a dense, operational, highly scannable interface.

Core behavior:

- Tables, filters, status badges, and row actions are the primary UI.
- Screen hierarchy must support repeated daily use.
- Avoid decorative marketplace effects in operational panels.
- Preserve role-based navigation and permissions.
- Admin, dealer, employee, account settings, orders, payouts, approvals, listings, and CRUD modals use this language.

Visual character:

- Compact spacing.
- Clear table headers and row boundaries.
- Neutral surfaces with minimal shadows.
- Status colors are semantic and text-supported.
- Toolbar actions are aligned and predictable.

## 3. Semantic Tokens

Use semantic tokens first. Component code should reference tokens through CSS variables and Tailwind mappings rather than raw hex values.

### Color Tokens

```css
:root {
  color-scheme: light;

  --vnw-page: #fbfaf7;
  --vnw-page-subtle: #f6f2ea;
  --vnw-surface: #ffffff;
  --vnw-surface-elevated: #ffffff;
  --vnw-surface-muted: #f7f4ee;
  --vnw-surface-hover: #f3eee5;

  --vnw-text-primary: #1f1d1a;
  --vnw-text-secondary: #5f5a52;
  --vnw-text-muted: #7c756b;
  --vnw-text-disabled: #a7a099;
  --vnw-text-inverse: #ffffff;

  --vnw-border: #e3ddd3;
  --vnw-border-strong: #cfc5b7;
  --vnw-border-subtle: #eee9e1;

  --vnw-gold: #a16207;
  --vnw-gold-hover: #854d0e;
  --vnw-gold-soft: #f5ead2;
  --vnw-gold-border: #d6b56d;

  --vnw-action: #2b2925;
  --vnw-action-hover: #171512;
  --vnw-action-soft: #efebe3;

  --vnw-success: #15803d;
  --vnw-success-bg: #ecfdf3;
  --vnw-success-border: #bbf7d0;

  --vnw-warning: #b45309;
  --vnw-warning-bg: #fffbeb;
  --vnw-warning-border: #fde68a;

  --vnw-danger: #b91c1c;
  --vnw-danger-bg: #fef2f2;
  --vnw-danger-border: #fecaca;

  --vnw-info: #0369a1;
  --vnw-info-bg: #eff6ff;
  --vnw-info-border: #bfdbfe;

  --vnw-focus: #a16207;
  --vnw-focus-ring: rgba(161, 98, 7, 0.28);

  --vnw-chart-1: #a16207;
  --vnw-chart-2: #2563eb;
  --vnw-chart-3: #15803d;
  --vnw-chart-4: #b45309;
  --vnw-chart-5: #7c3aed;
  --vnw-chart-grid: #e8e2d8;
}

.dark {
  color-scheme: dark;

  --vnw-page: #12100f;
  --vnw-page-subtle: #171412;
  --vnw-surface: #1d1916;
  --vnw-surface-elevated: #25201c;
  --vnw-surface-muted: #2c2621;
  --vnw-text-primary: #f7f2e8;
  --vnw-text-secondary: #bfb5a6;
  --vnw-border: #3c342c;
  --vnw-border-strong: #574a3c;
  --vnw-gold: #e0ae45;
  --vnw-gold-hover: #f0c467;
  --vnw-purple-accent: #a985ff;
}
```

Allowed color roles:

- Gold is a brand accent, not the whole palette.
- Charcoal is for text and primary action fill.
- Blue is for informational dashboard data and links.
- Green, amber, and red are reserved for status meaning.
- Purple remains a restrained secondary accent and categorical chart color; gold remains the primary interactive accent.
- Brand artwork and uploaded creative keep their authored colors. Theme the surrounding canvas instead of filtering the asset.

### Typography Tokens

Use the existing Inter font stack. Avoid introducing new dependencies.

```css
--font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;

--leading-tight: 1.2;
--leading-heading: 1.25;
--leading-body: 1.5;
--leading-relaxed: 1.65;
```

Typography rules:

- Body text minimum: 16px on customer-facing forms and long copy.
- Dashboard table text may use 14px when density is needed.
- Headings: 700 to 800 weight.
- Body: 400 to 500 weight.
- Labels: 500 to 700 weight.
- Prices and mobile numbers use tabular numerals where possible.
- Avoid negative letter spacing.
- Uppercase labels must be short and readable.

### Spacing Tokens

Use a 4px base scale.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
```

Storefront spacing:

- Page gutters: 16px mobile, 24px tablet, 32px desktop.
- Section gaps: 32px mobile, 48px tablet, 64px desktop.
- Card padding: 16px mobile, 20px to 24px desktop.

Dashboard spacing:

- Page gutters: 12px mobile, 16px tablet, 24px desktop.
- Panel padding: 12px to 16px.
- Table cell padding: 10px to 14px vertical, 12px to 16px horizontal.

### Border Radius Tokens

```css
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;
```

Radius rules:

- Buttons, inputs, selects: 8px to 12px.
- Product cards: 12px to 16px.
- Dashboard cards and tables: 10px to 12px.
- Modals and sheets: 16px.
- Avoid 24px+ radii except for pills and intentional brand lockups.

### Shadow Tokens

```css
--shadow-xs: 0 1px 2px rgba(31, 29, 26, 0.05);
--shadow-sm: 0 2px 8px rgba(31, 29, 26, 0.06);
--shadow-md: 0 8px 24px rgba(31, 29, 26, 0.08);
--shadow-lg: 0 18px 48px rgba(31, 29, 26, 0.12);
```

Shadow rules:

- Default cards use border plus `shadow-xs` or no shadow.
- Hover elevation may increase to `shadow-sm`.
- Modals may use `shadow-lg`.
- Avoid colorful shadows.
- Avoid heavy glow effects.

### Motion Tokens

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 240ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Motion rules:

- Use transform and opacity only.
- Hover and press feedback: 120ms to 180ms.
- Sheet/modal entry: 180ms to 240ms.
- No continuous decorative animation.
- No shine sweeps, floating ornaments, or looping hero effects.
- Respect `prefers-reduced-motion`.

## 4. Component Standards

### Buttons

Base:

- Min height: 44px customer, 36px to 40px dashboard.
- Radius: 10px to 12px.
- Font weight: 700 for primary, 600 for secondary.
- Include `cursor-pointer`, disabled semantics, and visible focus ring.

Variants:

- Primary: charcoal background, white text.
- Brand: gold background only for high-value conversion or premium emphasis.
- Secondary: white background, charcoal text, neutral border.
- Ghost: transparent, charcoal text, hover muted surface.
- Danger: red semantic color, not gold or charcoal.
- Icon button: 40px minimum dashboard, 44px customer, always with `aria-label`.

Do:

- Use Lucide icons consistently.
- Keep one primary CTA per surface.
- Show loading state on async submit.

Do not:

- Use purple or magenta gradient buttons.
- Use shine animations.
- Use icon-only buttons without labels or accessible names.

### Inputs, Selects, and Textareas

Base:

- Height: 44px storefront, 40px dashboard.
- Text: 16px on mobile-facing fields to avoid zoom issues.
- Background: white.
- Border: neutral token.
- Radius: 10px.
- Focus: gold ring plus stronger border.

Required behavior:

- Visible label for every input.
- Placeholder is example text only, not the label.
- Helper text for complex fields.
- Error text directly below the field.
- `aria-invalid` and `aria-describedby` when invalid.
- Autocomplete attributes where appropriate.

Selects:

- Use native select for simple filters.
- Use Radix select/combobox only where search or richer behavior is needed.
- Keep selected state visible.

Textareas:

- Minimum height: 96px customer forms, 80px dashboard forms.
- Resize vertical where acceptable.

### Search Controls

Search is the primary storefront control.

Homepage:

- Hero search should be the dominant first-screen control.
- Include search input, category/operator selector if useful, and one clear Search CTA.
- Popular searches appear as small buttons below.
- AI search can be a mode or secondary option, not the default visual focus.

Shop:

- Search remains visible above product results.
- Active filters must be shown as removable chips.
- Mobile filter opens as a bottom sheet.
- Preserve query params for deep linking.

Accessibility:

- Search input has visible label or labelled container.
- Submit button has text.
- Clear button has `aria-label`.

### Filters

Storefront filters:

- Use collapsible groups on mobile.
- Use a sticky side panel only on desktop when it does not trap scrolling.
- Active filters must be obvious.
- Price filters should show min/max and selected value text.

Dashboard filters:

- Use compact toolbar layout.
- Prefer inline select, search, date range, status tabs.
- Keep Reset/Clear filters secondary.
- Use badges or count text to show result scope.

### Number Listing Cards

Customer product cards must prioritize:

1. Mobile number.
2. Price and discount.
3. Availability/status.
4. Category/operator/numerology.
5. Buy/Add/Compare/Wishlist actions.

Card standard:

- White surface, neutral border, light shadow.
- Radius: 12px to 16px.
- No heavy premium-gold backgrounds for every card.
- Use gold as small badge or accent line.
- Number text: large, tabular, high contrast.
- Price: clear hierarchy with offer price stronger than MRP.
- Primary action: Buy Now or View Details.
- Secondary actions: wishlist, compare, add to cart.
- Sold state must visibly disable purchase actions and include text.

Mobile:

- Cards should fit a single column comfortably.
- Icon buttons at least 44px touch target.
- Avoid four-column micro-stat layouts if text becomes tiny.

### Number Detail Sections

Page hierarchy:

1. Back/breadcrumb.
2. Number and primary purchase action.
3. Price, discount, availability.
4. Trust and transfer details.
5. Enquiry/callback.
6. Related numbers.
7. Reviews.

Detail hero:

- Use white or warm-neutral panel.
- Number is the visual anchor.
- Buy Now must be the primary CTA.
- Add to cart and wishlist are secondary.
- WhatsApp/callback are support actions, not primary purchase replacements.

Trust content:

- Use concise icon plus text rows.
- Include verification, secure payment, transfer support, delivery timeline where available.

### Navigation

Public desktop:

- Header stays light, compact, and readable.
- Logo lockup must not crowd nav/actions.
- Search entry should be easy to find.
- Account menu must be clickable, not hover-only.
- Current page state visible.

Public mobile:

- Header uses logo, cart, and menu.
- Search can be surfaced through bottom nav center action or header search.
- Drawer must close on Escape and route change.

Account/dashboard:

- Desktop uses sidebar.
- Mobile uses drawer plus bottom navigation for top tasks.
- Active nav state uses gold/charcoal indicator, not purple gradient.
- Dangerous actions like logout are visually separated.

### Mobile Bottom Navigation

Rules:

- Max 5 items.
- Each item has icon and text label.
- Minimum touch height: 56px plus safe-area inset.
- Center action may be Search, but should not visually overpower other tabs.
- Active state uses clear color, weight, and/or top indicator.
- Do not use bottom nav for nested dashboard sub-navigation.

Recommended customer items:

- Home.
- Shop.
- Search.
- Wishlist.
- Account.

Recommended account mobile items:

- Dashboard.
- Orders/Listings.
- Sell or Numbers depending on role.
- Notifications or Users depending on role.
- Profile.

### Tables

Dashboard tables:

- White surface with neutral border.
- Sticky header where useful.
- Header text uppercase or semibold, 12px to 13px.
- Row height: 48px to 56px.
- Actions right-aligned.
- Use text plus icon for destructive or high-risk row actions where space allows.
- Status badges use semantic colors and readable text.
- Numeric columns use tabular figures and align right when appropriate.

Mobile tables:

- Convert to labelled cards.
- Preserve column labels with `data-label`.
- Primary identifier appears at top.
- Actions grouped at bottom.

Accessibility:

- Use table semantics for tabular data.
- Sortable columns must expose `aria-sort`.
- Do not rely on color alone for status.

### Dashboard Cards

Stat cards:

- Compact.
- Label, value, optional delta, optional icon.
- Use neutral background.
- Gold only for brand KPI emphasis, not every metric.
- Green/red deltas include text or arrows and accessible labels.

Dashboard panels:

- Clear title and optional toolbar.
- Avoid decorative badges like "VNW Console" on every page if they reduce scanability.
- Use consistent panel heading size.

### Modals and Sheets

Use Radix Dialog/AlertDialog where possible.

Required behavior:

- `role="dialog"` or Radix equivalent.
- `aria-labelledby`.
- Focus trap.
- Escape closes non-destructive modals.
- Close button with accessible label.
- Return focus to trigger.
- Scrim strong enough for separation but not black-page styling.

Visual:

- White surface.
- Radius: 16px.
- Shadow: `shadow-lg`.
- Header, body, footer structure.
- Primary action on the right on desktop, full-width or stacked on mobile.

Destructive confirmation:

- Use AlertDialog.
- Danger color for destructive action.
- Plain-language title and recovery path.

### Empty States

Empty states should be helpful, not decorative.

Structure:

- Optional Lucide icon.
- Clear title.
- One-sentence explanation.
- One primary action where appropriate.

Examples:

- Cart empty: "Your cart is empty" plus "Browse VIP numbers".
- No search results: explain filters and offer clear filters action.
- Dashboard no rows: explain what will appear here.

Visual:

- White or muted surface.
- Border.
- No large illustration required.
- No emoji.

### Loading Skeletons

Use skeletons for loads over 300ms.

Rules:

- Match final content shape.
- Use subtle neutral shimmer or static pulse.
- Respect reduced motion.
- Do not show blank panels.
- Use `aria-busy="true"` and polite live regions where helpful.

### Error States

Error content must include:

- What happened.
- What the user can do next.
- Retry action where applicable.
- Field-specific errors near invalid fields.

Visual:

- Use danger background, border, and text tokens.
- Include icon plus text.
- Do not use color alone.

## 5. Accessibility Standards

Minimum requirements:

- Normal text contrast: 4.5:1 or better.
- Large text and UI glyph contrast: 3:1 or better.
- Visible focus ring on all interactive elements.
- Keyboard navigation follows visual order.
- Forms use visible labels.
- Icon-only controls have `aria-label`.
- Dialogs trap focus and close predictably.
- Touch targets: 44px minimum for customer/mobile surfaces.
- Do not disable browser zoom.
- Do not use placeholder-only labels.
- Respect `prefers-reduced-motion`.
- Use semantic HTML before custom roles.
- Current navigation state should be announced with `aria-current`.

Focus ring:

```css
outline: 2px solid var(--vnw-focus);
outline-offset: 2px;
box-shadow: 0 0 0 4px var(--vnw-focus-ring);
```

## 6. Responsive Breakpoints

Use Tailwind defaults, but validate against these product breakpoints:

- 360px: small Android.
- 375px: small iPhone.
- 430px: large phone.
- 768px: tablet portrait.
- 1024px: tablet landscape and small desktop.
- 1280px: desktop.
- 1440px: wide desktop.

Layout rules:

- Mobile-first CSS.
- No horizontal page scroll.
- Use `min-h-dvh` where full-height layouts are needed.
- Fixed headers and bottom nav must reserve content padding.
- Sidebars appear at 1024px and above.
- Storefront content max width: 1200px to 1280px.
- Operational dashboard max width may be full available width.

## 7. Charts and Dashboards

Chart standards:

- Use accessible colors from chart tokens.
- Grid lines are subtle.
- Labels and axes must be readable at mobile sizes.
- Tooltips show exact values.
- Provide text summary for key insights where practical.
- Avoid pie/donut charts for more than 5 categories.
- Do not rely on red/green alone.
- Chart animations must be optional and brief.

Dashboard KPI color use:

- Revenue or premium marketplace KPI may use gold.
- Success rates use green.
- Pending workflows use amber.
- Failures, rejects, blocked accounts use red.
- Informational trend or volume metrics may use blue.

## 8. Storefront Page Standards

### Home

Goal: Start search quickly and build trust.

Required sections:

1. Search-first hero.
2. Popular searches and category shortcuts.
3. Featured or trending numbers.
4. Trust and process explanation.
5. Seller/dealer CTA if business needs it.
6. Testimonials only if concise and verified-looking.

Avoid:

- Decorative floating numbers.
- Large glass hero cards.
- Continuous animations.
- Multiple competing CTAs.

### Shop

Goal: Browse, filter, and compare numbers efficiently.

Required:

- Search bar at top.
- Result count.
- Sort.
- Filters.
- Active filter chips.
- Product grid.
- Empty state and loading state.
- Pagination or infinite loading with clear feedback.

### Number Detail

Goal: Make purchase decision easy.

Required:

- Clear number display.
- Price and discount.
- Availability.
- Buy Now primary CTA.
- Add to cart and wishlist secondary.
- Trust and transfer details.
- Enquiry form with labels.
- Related numbers.

### Cart and Checkout

Goal: Complete purchase with confidence.

Required:

- Clear item list.
- Order summary.
- Coupon feedback.
- Payment loading state.
- Trust/security line.
- Clear error recovery.

## 9. Dashboard Page Standards

### Admin

Goal: Manage marketplace operations quickly.

Priorities:

- KPI overview.
- Pending approvals and exceptions.
- Orders, numbers, users, dealers, payouts.
- Filters and bulk actions.
- Dense tables.

### Dealer

Goal: Manage listings, sales, payouts, and profile.

Priorities:

- Listing status.
- Add number.
- Sales and payout summaries.
- Commission and wallet clarity.
- Clear approval states.

### Employee

Goal: Complete assigned operational work.

Priorities:

- Task queues.
- Numbers and sell requests.
- User support.
- Submission status.

### Buyer Account

Goal: Review orders, wishlist, referrals, settings.

Priorities:

- Recent orders.
- Wishlist and referrals.
- Profile and password management.
- Notifications.

## 10. Implementation Boundaries

Allowed:

- React component styling.
- Tailwind classes and CSS variables.
- Existing Radix/shadcn-style primitives.
- Existing Lucide icons.
- Existing Recharts setup.
- Frontend-only accessibility improvements.
- Frontend-only layout and responsive improvements.

Not allowed:

- Backend API changes.
- MySQL schema changes.
- Authentication or authorization changes.
- Role or permission logic changes.
- Dependency installation.
- Payment business logic changes.

## 11. Implementation Order

Recommended page and component order:

1. Foundation tokens: `index.css`, Tailwind theme mapping, shared focus, radius, shadow, motion rules.
2. Core primitives: button, input, select, textarea, label, field error, badge, card, modal, skeleton, table.
3. Layouts: `PublicLayout`, `BottomNav`, `AccountLayout`.
4. Storefront search flow: Home, Shop, NumberCard, filters.
5. Number detail and conversion flow: NumberDetail, Cart, Checkout.
6. Auth and account forms: login, register, forgot, profile, change password.
7. Dashboard shell and shared dashboard components: PageHeader, StatCard, Table, StatusBadge, EmptyState.
8. Admin high-traffic pages: AdminDashboard, AdminNumbers, AdminOrders, AdminSellRequests, AdminApprovals.
9. Dealer pages: DealerDashboard, DealerListings, DealerListingForm, DealerSales, DealerPayouts, DealerProfile.
10. Employee pages: EmployeeDashboard, EmployeeNumbers, EmployeeSellRequests, EmployeeUsers, EmployeeSubmissions.
11. Secondary pages: Wishlist, Compare, Orders, OrderDetail, Referrals, SellNumber, Numerology, About, Contact.
12. Final QA: 360/375/430/768/1024/1280/1440 viewport checks, keyboard-only pass, reduced-motion pass, color contrast pass.

## 12. Final Quality Checklist

- System, light, and dark modes work across every route and portal.
- Dark mode uses warm charcoal rather than pure black.
- Explicit preferences persist across reload, login, and logout without an initial light flash.
- No purple or magenta gradients.
- No excessive glassmorphism or blur.
- No continuous decorative animation.
- No oversized rounded cards.
- No emoji icons.
- Semantic tokens used for colors.
- Storefront is search-first.
- Dashboards are dense and operational.
- Forms have visible labels and errors.
- Touch targets meet minimum sizes.
- Focus rings are visible.
- Tables are responsive and scannable.
- Loading, empty, and error states are present.
- Browser zoom remains enabled.
- No backend, database, auth, role, or dependency changes.
