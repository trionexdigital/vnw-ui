/**
 * theme.ts — Single source of truth for the app's visual design tokens.
 * ────────────────────────────────────────────────────────────────────────────
 * Everything that should stay consistent across every screen lives here:
 * the font, type scale, the accent/state colours, radius, and the reusable
 * Tailwind class presets that define the "PatientForm" look (cards, inputs,
 * labels, section headers). Import these instead of re-typing class strings so
 * the whole app changes from one place.
 *
 *   import { ui, tokens } from "@/core/config/theme";
 *   <div className={ui.card}> … </div>
 *
 * Colours that theme through CSS variables (background/foreground/border) keep
 * working via index.css; this file owns the brand accent (sky) + the presets.
 */

// ── Raw tokens ───────────────────────────────────────────────────────────────
export const tokens = {
  /** One font family for the whole app (kept in sync with tailwind.config + index.css). */
  fontFamily:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  fontSize: {
    xs: "0.62rem",   // field errors / tiny meta
    sm: "0.65rem",   // floating labels
    base: "0.75rem", // captions / section titles
    md: "0.875rem",  // body / inputs (text-sm)
    lg: "1rem",
  },

  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },

  radius: { md: "0.5rem", lg: "0.75rem", full: "9999px" }, // rounded-lg / rounded-xl

  /** Brand accent + state colours, as Tailwind colour names so utilities compose. */
  color: {
    accent: "accent",
    accentHex: "#A16207",
    error: "destructive",
    muted: "muted",
  },
} as const;

// ── Reusable class presets (the "PatientForm" look) ──────────────────────────
export const ui = {
  /** Card surface used for form sections / panels. */
  card: "rounded-xl border border-card-border bg-card text-card-foreground shadow-sm",

  /** Section title (icon + UPPERCASE label). */
  sectionTitle:
    "text-[0.67rem] font-bold tracking-widest text-muted-foreground uppercase whitespace-nowrap",

  /** Small label sitting above a field (Settings screens). */
  topLabel:
    "block mb-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase",

  /** Inline field error text. */
  fieldError: "mt-0.5 pl-0.5 text-[0.62rem] text-destructive leading-none",

  /** Base input box (height-10) — shared by floating-input / settings inputs. */
  input:
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors " +
    "placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20",

  /** Compact input box (height-9) — used inside dense forms. */
  inputCompact:
    "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors " +
    "placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20",

  /** Error border modifier for inputs. */
  inputError: "border-destructive focus:border-destructive",

  /** Dropdown menu surface (combobox / select popovers). */
  menu:
    "absolute z-50 left-0 right-0 top-full mt-1 max-h-52 overflow-auto rounded-lg border border-popover-border " +
    "bg-popover text-popover-foreground shadow-lg",

  /** Dropdown menu row. */
  menuItem:
    "w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground",

  /** Floating label colours when raised (has value / focused). */
  floatingLabelRaised:
    "text-[0.65rem] font-medium px-1 bg-background text-primary",
} as const;

export type UiPreset = keyof typeof ui;
export default { tokens, ui };
