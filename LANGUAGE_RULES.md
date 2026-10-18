# Storefront language rules

These rules apply to every public store page and customer account screen, including lazy routes, authentication, search, number details, family/corporate packs, checkout, notifications, legal pages, errors, dialogs, dropdowns and toasts. Admin/dealer/employee consoles retain their existing console language and appearance settings.

## Supported languages and ownership

English (`en`) is the source. Support Hindi (`hi`), Marathi (`mr`), Hinglish (`hg`), Gujarati (`gu`), Bengali (`bn`), Punjabi (`pa`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Malayalam (`ml`) and Odia (`or`). Keep native language names readable in the chooser. Remember the visitor's selection in `vnw_language`; a valid `?lang=` takes precedence. Navigation must retain the current preference.

Language data belongs to this application. Do not add translation APIs, widgets, scripts, credentials, external translation libraries or browser-translation workarounds. Browser translation is disabled with `translate="no"` on the HTML root so it cannot replace React's text nodes.

## Rendering

`scripts/react-localization-plugin.mjs` adapts JSX at build time to `LocalizedElement`. The adapter uses the language context and renders translated strings through React. It supports native elements, SVG text, router links, motion elements and the Radix primitives used by this app. It preserves refs, event handlers, keys, values and component composition. Native `option` and `tr` elements keep their identity for dropdown/table adapters.

Never use `MutationObserver`, `innerHTML`, `textContent`, `nodeValue`, `removeChild`, DOM replacement or document-wide translation scanning to translate React content. Do not remount the app, route, drawer or animation tree when the language changes.

Text children and textual attributes (`placeholder`, `title`, `aria-label`, `alt`, `data-label`) resolve against the catalog. Keep complete sentences together. Do not build sentences by concatenating translated words. Titles, subtitles, help text, empty/loading/error states, confirmation messages, accessibility labels, dropdown labels and toast content are all public copy.

For named values or library content outside adapted JSX, use the explicit API:

```tsx
const { t } = useLanguage();
const message = t('Welcome, {name}', { name: customer.name });
<LanguageText source="{count} numbers" values={{ count: numbers.length }} />
```

Add the same named placeholders to all translations. Values are inserted literally after resolving the message; never put customer names, addresses or other private values into translation source keys. Automatic numeric templates support the existing string-based messages. For new messages prefer `LanguageText` with named values, which also permits native word order.

`translate="no"`, `data-no-translate` or `data-private` on an adapted parent prevents translation of its subtree. Use these for customer identity, user-written content, official brand marks, telephone numbers, URLs, payment references, number-pattern codes and other literal identifiers. Form values and payload identifiers are never translated. Do not exclude an entire form/card merely to protect one value. Textarea values remain literal while their labels/placeholders are translated.

## Copy and catalogs

Author complete, reviewed translations for all eleven non-English languages when adding or changing public copy. Preserve meaning, legal conditions, amounts, dates, safety information and named placeholders. Hinglish is intentionally written in Latin script. Do not invent a short label that changes the meaning of a sentence, and do not treat unchanged English as a completed native translation.

Source files are `src/shared/language/catalog.tsv` and `storefront.tsv`. Each row contains the English source and eleven translations in the order documented at the top of the file. Do not edit generated locale JSON, the server bundle or SQL manually. Source matching normalizes whitespace and case; avoid different meanings that differ only in capitalization.

After editing source copy/catalogs, run from `vnw-ui`:

```powershell
node scripts/build-language-manifest.mjs
node scripts/build-language-catalogs.mjs
node scripts/audit-language-catalogs.mjs
```

The manifest registers public source text and page context for Admin → Languages. The builder validates every language row and placeholder set, and generates UI packs, the matching server bundle and re-runnable SQL. The audit reports missing source translations by page. Missing registered text must be reviewed and translated before claiming a page is fully localized. Generated source registration also contains shared/conditional copy; review exclusions as literal data rather than hiding missing meaningful copy.

Published administrator translations override the bundled defaults. Missing translations keep the original English text readable; this fallback is a recovery behavior, not translation completion. Never conceal it by deleting content or replacing it with a generic translated sentence.

## Administrator content and APIs

Admin → Languages supports search, source context, missing-only filtering, draft edits, JSON import/export and deliberate publication. Drafts must not change live pages. Revision/version checks prevent accidentally overwriting another editor's work. The language catalog request sends only the selected language, never rendered text fragments or private visitor data.

Use the application's rotating `Authorization` header when requesting `/site/languages/catalog`; this public endpoint does not require the visitor's JWT. A temporarily unavailable database/API must not break page navigation or the bundled packs. Apply the generated language migration to enable persistent administrator catalogs.

After changing public FAQs, banner copy, delivery descriptions or Lucky Pick text, register them using **Refresh storefront content**, fill the required translations, review and publish. When adding another editorial API/table, add its public text fields to `LanguageManagement.syncContent`. Never register customer profiles, private notes, form submissions or transaction data. Update the SQL source manifest with deployment so fresh installations expose the new strings in the editor.

## Layout and verification

All locales use the same components, breakpoints, width limits, gutters and header/drawer geometry. Never hide navigation/search, swap a desktop layout for mobile, or change grid columns based on `html.lang`. Allow labels to wrap within fixed navigation/control slots. Use classes or data attributes for CSS/test selectors; localized accessibility labels are not stable selectors.

The desktop store header uses left-aligned primary navigation with icons to the left of labels. More contains only How It Works and Contact. Sign In and Register have an icon on the left and text on the right, immediately before the icon-only language selector; other header actions use icons. Desktop has no navigation drawer or menu trigger. Mobile uses icon-only header actions, with the menu trigger on the far right opening a right-side drawer. The drawer has a fixed header containing the logo, icon-only language selector and close button in that order, a separately scrolling menu, and a fixed bottom footer. Guest Sign In and Register buttons share one row in the footer; signed-in customers retain their account footer. Keep controls within the drawer width, preserve scroll locking, restore focus without scrolling and support reduced motion.

Check a new/changed page in all 12 languages at 320, 375, 768, 1366 and 1920 pixels. Check headings, subtitles, information, validations, dialogs, dropdowns and toasts, not just primary buttons. Check word wrapping, clipping, overflow, retained number digits/prices and keyboard access. Exercise SPA links and language switching repeatedly while collecting browser console/page errors; hard reloads alone cannot catch React navigation failures. Test drawers opened, scrolled, closed and reopened in guest and signed-in states. Run the relevant UI, API and browser regression tests before delivery.
