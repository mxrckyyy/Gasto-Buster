# UI Refactor Notes — Onyx/Yellow + Full-Width + Collapsible Sidebar

Status: complete. 6 commits on `main`, one per phase.

| Phase | Commit | Contents |
|---|---|---|
| A — tokens | `a058e73` | Token system + fluid spacing + theme mapping |
| B — primitives | `6068949` | UI kit, hooks, shell, first migrations |
| C — screens | `e655977` | Header/TransactionList/CategoryChart/ChartSkeleton + modal polish |
| E — sidebar | `73beadf` | Collapsible sidebar + PageShell wiring |
| F — polish | `f80ce4b` | Touch targets + fluid internal padding |
| Docs | (this file) | UI_REFACTOR_NOTES.md |

## Files changed

**New**

```
src/styles/tokens.css                  design tokens (single source of truth)
src/utils/cn.js                        className joiner
src/hooks/useMediaQuery.js             SSR-safe matchMedia hook
src/hooks/usePrefersReducedMotion.js   reduced-motion gate (sidebar/drawer)
src/hooks/useSidebarState.js           persisted rail mode + drawer state
src/hooks/useScrollLock.js             ref-counted body lock w/ scrollbar comp
src/components/ui/{Button,Card,Input,Chip,Stack,Grid,Sheet,PageShell}.jsx
src/components/layout/Sidebar.jsx      utility rail / drawer content
```

**Modified**

```
src/index.css          @theme inline token→utility map, .focus-ring, motion
src/main.jsx           imports tokens.css first
index.html             viewport-fit=cover, #portal-root, theme-color #0A0A0B
src/constants/ui.js    FOCUS_RING_CLASSES → 'focus-ring'
Dashboard.jsx          PageShell slots, section ids, token gaps
Header.jsx             hamburger (onOpenNav), tokens, safe-area, lg:hidden brand
TransactionList.jsx    Card shell, fluid row grid, Chip, 44px actions
CategoryChart.jsx      token chrome, fluid square donut
ChartSkeleton.jsx      mirrors chart geometry exactly
BudgetBanner.jsx       token tint/status bar
SummaryCards.jsx       Grid + Card tokens
ExpenseFormModal.jsx   Sheet + primitives + 44px touch targets
SettingsModal.jsx      Sheet + primitives
```

## Primitives (props)

- **Button** — `variant` primary | secondary | ghost | danger | danger-solid, `size` sm | md | lg (all ≥44px), `as`, rest spread to element. Primary = yellow bg, black text (12.3:1).
- **Card** — `pad` 3 | 4 | 5 | 6 | none (fluid `--space-*`), `as`, `className`. `pad` exists so utilities never fight over padding (no tailwind-merge in project).
- **Input** — label/description/error wired via `aria-describedby`; exports `FIELD_CLASSES` (shared with Select/Date/textarea: `min-h-11`, invalid border via unlayered `[aria-invalid='true']` rule).
- **Chip** — neutral/accent tone pill for Expense/Income badges.
- **Stack** — `gap` 1–7 → `--space-*`, `row`, no raw gap classes needed.
- **Grid** — `cols` responsive preset map (summary cards etc.).
- **Sheet** — modal/drawer dialog: portal (`getPortalRoot` → `#portal-root ?? body`), focus trap + restore (`useFocusTrap`), scroll lock, Escape (bubble-phase, so CategorySelect's capture-phase Escape wins first), `titleId`/`descId`/`data-autofocus`.
- **PageShell** — full-screen app shell. Slots: `header` receives `{ openNav }`; `sidebar` receives `{ collapsed, toggle, closeNav }` and is rendered twice (desktop rail + `<lg` drawer via portal). Sets `data-sidebar` on root → one `--sidebar-w` flip reflows the whole grid.

## Token & spacing decisions

- `src/styles/tokens.css` is the **only** place hex values exist; `@theme inline` in `index.css` maps them to utilities (`bg-surface`, `text-accent`, `border-onyx-line`, `shadow-md` → `--shadow-2`, …). Audit: zero raw hex in JSX.
- Fluid scale: `--space-1..7 = clamp(min, vw, max)` (e.g. `--space-4: clamp(16px, 1.5vw, 24px)`), `--gutter: clamp(16px, 3vw, 48px)` for all page-level padding, `--section-gap` / `--stack-gap` for vertical rhythm, `--content-max: 1600px` caps content on ultrawide while the shell stays full-width.
- **Breakpoint strategy**: mobile-first single column (block shell, drawer nav) → `sm: 640px` card grids → `md: 768px` centered dialogs → `lg: 1024px` persistent sidebar grid (`grid-cols-[var(--sidebar-w)_1fr]`) + header hamburger hidden → `xl`/`2xl` only for chart side-by-side. Section wrappers use `scroll-mt-28` so hash jumps clear the sticky header.
- Focus: every interactive element uses `.focus-ring` (yellow glow, visible on dark). Touch targets ≥44px (`min-h-11` / `h-11 w-11`), including the type-toggle buttons and listbox options.

## Sidebar state model

- `useSidebarState` (in `hooks/useSidebarState.js`): rail mode persisted in `localStorage['gb.sidebar']` (`expanded` | `collapsed`) via the shared `useLocalStorage` hook; drawer open state is **not** persisted.
- Root attribute: `[data-sidebar='collapsed']` flips `--sidebar-w` to the 72px token — no component-level width math.
- Rail: brand carries the page `<h1>` (sr-only when collapsed, so exactly one h1 exists per mode), Add Transaction quick action, hash-anchor jump links (Summary / Spending / Transactions — anchors, not routes), Overview stats (total spent, net balance, today vs cap), Settings + collapse toggle pinned bottom. Collapsed mode is icon-only with `title` + `aria-label`.
- Drawer (`<lg`): same content without the toggle, portal + scrim, focus trap, Escape close, close nav **before** opening any modal (scroll-lock ref-counting handles the handoff).
- Media-query listener force-closes the drawer when `lg` becomes active.

## Overlay contract (locked by tests)

`ModalA11y.test.jsx` locks: dialog accessible names, `data-autofocus` first stop, Tab trap, Escape in **bubble** phase (listbox capture listener runs first). Any new overlay must use `Sheet`/`useFocusTrap`/`useScrollLock` — ref-counted lock with scrollbar-width compensation keeps layout from jumping.

## Contrast audit (WCAG AA, computed against #141416 surface)

| Foreground | Ratio | Verdict |
|---|---|---|
| yellow `#ffc300` on surface | 11.4:1 | pass (text + UI) |
| on-yellow black on yellow CTA | 12.3:1 | pass |
| gray-100 / gray-300 / gray-500 text | 16.9 / 10.9 / 5.4 | pass AA text |
| gray-700 `#4a4a52` as text | 2.1:1 | **fails → borders/dividers only** (enforced in code review) |
| category colors (all 12, incl. `others` #64748b @ 3.87) | ≥3:1 | pass non-text (chart strokes/dots are data + labeled legend) |

No palette changes were needed.

## Verification

- `npm run audit` → **AUDIT CLEAN** (every phase)
- `npm test` → **74/74 pass** (every phase; ModalA11y contract untouched)
- `npm run build` → success; PWA assets present: `dist/sw.js`, `dist/workbox-dc521307.js`, `dist/manifest.webmanifest`
- Grep: zero default-palette Tailwind classes (slate/indigo/…) and zero raw hex left in `src/**/*.jsx`
- Out-of-scope untouched: business logic, state, `vite.config.js`, CI

## Follow-ups (known, intentional)

1. **`vite.config.js` manifest still lists the old slate `theme_color`** — PWA config was out of scope; flip to `#0a0a0b` when PWA changes are allowed.
2. Micro-gaps (`gap-1/2`, `mt-1`) inside compound rows stay on Tailwind's 4px grid — they equal the low end of the fluid scale; page/card/section padding all use `--space-*`/`--gutter`.
3. `constants/categories.js` `chipClass` fields remain unused (colors are data, chips map them at render).
4. `html { scroll-behavior: smooth }` is already gated by `prefers-reduced-motion`; progress-bar width transitions are intentionally left animated (functional feedback).
