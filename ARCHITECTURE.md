# Gasto Buster — Architecture

> **Phase 6 Status:** ✅ **Completed** — PWA support (installable manifest,
> generated 192/512 icons, Workbox precache + runtime caching for full offline
> use) and GitHub Actions CI (`checkout` → Node 22 → `npm ci` → `npm run audit` →
> `npm run build`). Tests green (74), audit clean, production build verified with
> `sw.js` / `workbox-*.js` / `manifest.webmanifest` emitted. **Project status:
> Production-Ready / PWA-Enabled.**
> This document is the source of truth for the project. Any AI session or developer
> should scan this file first after a context reset.

---

## 1. Project Overview

| Field | Value |
| --- | --- |
| **Project Name** | Gasto Buster |
| **Tagline** | Student Expense Tracker |
| **Type** | Responsive Single Page Application (SPA) |
| **Target Users** | Students tracking allowances, school spending, and daily budgets |
| **Architecture** | Local-First (no backend required for primary data storage) |
| **PWA** | Installable offline app (`display: standalone` + Workbox service worker) |
| **Deployment** | Vercel (static SPA hosting) + GitHub Actions CI |

### Scope

Gasto Buster helps students see where their money goes and stay within a daily
allowance. All data lives in the browser of the user who entered it.

**In scope (product):**

- Dashboard summary (total spend, remaining budget, top category, daily average)
- Category spending donut chart
- Add / Edit / Delete expense forms with validation
- Daily allowance cap with alert indicators
- Filterable, searchable transaction history (by date, category, type, amount)
- Settings (currency, locale, daily allowance)

**Out of scope (for now):**

- User accounts, authentication, servers, databases
- Cloud sync / multi-device sync
- Shared or multi-user budgets
- Payment integrations or bank feeds

---

## 2. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build Tool | **Vite** | Instant HMR, simple SPA config, first-class Vercel support |
| UI Library | **React 18+ (`*.jsx`)** | Component model fits the dashboard/form split |
| Styling | **Tailwind CSS v4** | Utility-first, no stale class soup, fast iteration |
| Icons | **Lucide React** | Tree-shakeable, consistent 24px stroke icons |
| Validation | **Zod** | One schema = runtime guard + form rules + typed shape |
| Charts | **Recharts** | Declarative donut/bar charts that compose with React |
| Persistence | **LocalStorage / IndexedDB** | Browser-isolated storage, zero network exposure |
| Routing | React state / lightweight client router | SPA rewrite handled by `vercel.json` |
| Testing | **Vitest + Testing Library + jsdom** | Same Vite pipeline as the build; React 18 act-compatible |
| PWA / Offline | **vite-plugin-pwa (Workbox)** | Build-time only: precache + runtime caching, no SW code in `src/` |

**Package manifest (Phase 5–6):** see `package.json`
`react`, `react-dom`, `lucide-react`, `zod`, `recharts`, `react-hook-form`,
`@hookform/resolvers` +
dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`,
`vite-plugin-pwa`, `vitest`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`,
`@testing-library/dom`, `jsdom`.

---

## 3. Core Features

1. **Dashboard summary** — total spent this month, remaining allowance, transaction
   count, average spend per day.
2. **Category donut chart** — Recharts `PieChart` (innerRadius) driven by grouped
   expense totals; slices use the color codes declared in `src/constants/categories.js`.
3. **Add / Edit / Delete expenses** — modal or slide-over form; same schema for
   create and update; optimistic local updates.
4. **Daily allowance cap** — `settings.dailyAllowance` compared against spend for the
   selected day; warning (80%) and breach (100%) states surfaced as alerts/badges.
5. **Filterable transaction history** — filter by text, category, type
   (`expense`/`income`), date range; sort by date or amount.

---

## 4. Security & Data Isolation

Security model is **local-first**: the attack surface is the browser, not an API.

- **Zero cross-user data exposure.** Data is written to the user's own
  `localStorage` (small records) or IndexedDB (larger histories). Nothing is sent to
  a server, so there is no shared store, no IDOR risk, and no cross-tenant leakage.
  Anyone opening the app on another browser/device sees an empty, private store.
- **No backend for primary storage.** No credentials, tokens, or API keys exist in
  the client bundle. If a sync feature is added later it must be opt-in and
  explicitly documented here.
- **Strict schema validation (Zod).** Every write passes through
  `src/utils/validation.js`. Unknown keys are stripped (`.strict()`-style behavior),
  amounts must be finite and positive, dates must be real `YYYY-MM-DD` calendar
  dates, categories must be known IDs. Unvalidated data never reaches storage.
- **XSS sanitization.** All user text is rendered as React text nodes (auto-escaped);
  no `dangerouslySetInnerHTML` anywhere in the app. User strings are trimmed and
  length-capped (title ≤ 80, note ≤ 200) before storage. URLs are never constructed
  from user input.
- **Storage hygiene.** Reads are re-validated with Zod before use — corrupted or
  hand-edited storage fails closed (falls back to defaults) instead of crashing.
  Storage keys are namespaced (`gasto-buster:*`) to avoid collisions.
- **Dependency surface.** Only the declared stack above; no analytics, no CDNs, no
  third-party scripts.

---

## 5. Data Model

```js
// Expense record (validated by expenseSchema)
{
  id: "exp_1690000000000_ab12cd",   // generated client-side
  title: "Campus cafeteria lunch",   // string, trimmed, 1..80 chars
  amount: 145.5,                     // number, > 0, <= 1,000,000,000
  category: "food",                  // one of CATEGORY_IDS
  type: "expense",                   // "expense" | "income"
  date: "2026-09-27",                // strict YYYY-MM-DD
  note: "",                          // optional, <= 200 chars (Phase 2)
  createdAt: "2026-09-27T08:00:00Z"  // ISO timestamp
}
```

**Storage layout**

| Key | Content |
| --- | --- |
| `gasto-buster:expenses` | `Expense[]` (localStorage; migrate to IndexedDB if > ~5k rows) |
| `gasto-buster:settings` | `{ currency, locale, dailyAllowance, monthStartDay }` |

---

## 6. Directory Breakdown

```
Gasto-Buster/
├── ARCHITECTURE.md            # This file — read first
├── .github/workflows/ci.yml   # CI: audit + build on push/PR to main
├── vercel.json                # SPA catch-all rewrite for Vercel
├── index.html                 # Vite entry document (theme-color + icon links)
├── package.json
├── vite.config.js             # Production build: manual vendor chunks + PWA
├── vitest.config.js           # Test runner: jsdom env + React transform
├── vitest.setup.js            # jest-dom matchers, crypto polyfill, storage reset
├── public/icons/              # PWA icons (generated; copied verbatim to /dist)
├── scripts/audit.cjs          # `npm run audit` — console/dead-code gate
├── scripts/generate-icons.cjs # `npm run generate:icons` — PWA icon source
├── dist/                      # Production build output (deployed to Vercel)
└── src/
    ├── main.jsx               # React root: providers + <App />
    ├── App.jsx                # App shell, routing/screen switching
    ├── index.css              # Tailwind entry + design tokens
    ├── assets/                # Static media (logo, empty-state art)
    ├── components/
    │   ├── common/            # Reusable UI: Button, Input, Card, Modal, Badge
    │   ├── dashboard/         # Summary cards, donut chart, budget indicators
    │   ├── forms/             # Add/Edit expense form + field components
    │   └── layout/            # Navbar, Sidebar, Header, Footer
    ├── context/               # React Context: ExpenseProvider + *.test.jsx
    ├── hooks/                 # useLocalStorage, useExpenses, useFocusTrap, …
    ├── utils/                 # formatters.js, validation.js, exportCsv.js (+ tests)
    ├── constants/             # categories.js (data) + ui.js (shared class tokens)
    └── types/                 # (optional) JSDoc typedefs if we stay on JS
```

| Folder | Responsibility | Rules |
| --- | --- | --- |
| `/src/components` | Presentational + composed UI. | No direct `localStorage` access; receive data/callbacks via props. `common/` must stay generic and reusable. |
| `/src/hooks` | Reusable stateful logic. | `useLocalStorage` is the **only** hook that touches storage; `useExpenses`/`useSettings` wrap it + Zod. `useFocusTrap` is shared by both dialogs. |
| `/src/utils` | Pure functions. | No React imports, no side effects — trivially unit-testable. |
| `/src/context` | Global state providers. | One provider per domain (expenses, settings); exposes CRUD that internally validates with Zod. |
| `/src/constants` | Static config + shared class tokens. | `categories.js` (categories, types, defaults); `ui.js` (`FOCUS_RING_CLASSES` used by every control). |
| `/src/types` | JSDoc typedefs / TS type stubs. | Optional; keep in sync with `validation.js` schemas. |
| `*.test.js(x)` | Automated tests. | Colocated with the module under test; no `export default` (the audit flags dead components); no `console.*`. |

**Data flow:** `components` → dispatch to `hooks`/`context` → `utils/validation.js`
guard → `utils/storage.js` persistence → state re-render.

---

## 7. Conventions

- Files: `PascalCase.jsx` for components, `camelCase.js` for everything else.
- One default export per component file; helpers exported as named exports.
- Formatting helpers (`formatCurrency`, `formatDate`) are the **only** way values
  reach the UI — no ad-hoc `toFixed()` in components.
- Tailwind classes only (no CSS modules); brand colors live in `index.css` tokens.
- All validation errors come from Zod and are mapped to field keys via
  `formatZodErrors()` so forms can render inline messages.
- **Accessibility (WCAG 2.1 AA):**
  - Every input/select/textarea has a `<label htmlFor>` (or `aria-label` when
    icon-only); errors render with `role="alert"` and are linked with
    `aria-invalid` + `aria-describedby`.
  - Every interactive control appends `FOCUS_RING_CLASSES` from
    `src/constants/ui.js` (`focus-visible:ring-2`), so keyboard focus is always
    visible without a ring on mouse clicks.
  - Both dialogs call `useFocusTrap({ containerRef, isOpen })`: focus lands on the
    `[data-autofocus]` field on open, Tab/Shift+Tab cycle inside the dialog, and
    focus returns to the trigger on `Esc`/close. `Esc` is consumed by the
    innermost open control first (the category listbox) before the dialog closes.
  - Primary flows are mouse-free: `Enter` submits (both dialogs are real
    `<form>`s), `Esc` closes, `N`/`+` opens the add form.
- **Testing:** tests colocate next to the module (`*.test.js(x)`), import
  `describe/it/expect` explicitly from `vitest`, and must not use `console.*` or
  default exports (both are rejected by `npm run audit`).
- **PWA:** the manifest and service worker are configured entirely in
  `vite.config.js` (`VitePWA`), so `src/` contains **no** SW registration code —
  the plugin injects `registerSW.js` into the built HTML. Icons are produced by
  `npm run generate:icons` (`scripts/generate-icons.cjs`); never hand-edit the
  PNGs. Theme color is declared once in `index.html` and once in the manifest.

---

## 8. Quality Gates (Phase 5–6)

Run these before every commit; all must exit 0.

| Gate | Command | Covers |
| --- | --- | --- |
| Unit + context tests | `npm run test` | `validation.test.js` (schema coercion, trimming, bad dates, negative amounts), `formatters.test.js` (PHP/USD currency, ISO dates), `ExpenseContext.test.jsx` (CRUD + daily-cap alerts), `ModalA11y.test.jsx` (focus trap, labels, keyboard) |
| Watch mode | `npm run test:watch` | Local TDD loop |
| Code audit | `npm run audit` | No `console.log/debug`, no `debugger`, no unused imports, no dead exports/components, no empty catches |
| Production build | `npm run build` | Clean `/dist` output, hashed assets, manual vendor chunks (react, zod, forms, lucide, recharts), PWA artifacts (`manifest.webmanifest`, `sw.js`, `workbox-*.js`), no bundler warnings |

**Continuous integration (`.github/workflows/ci.yml`):** every push and pull
request to `main` runs the same gates — `actions/checkout@v4` →
`actions/setup-node@v4` (Node 22) → `npm ci` → `npm run audit` → `npm run build`.
No tests in CI yet (add `npm run test` as a sixth step when the suite is
expanded).

**Vitest setup:** `vitest.config.js` runs specs in `jsdom` with the React plugin
only (no Tailwind/chunking config). `vitest.setup.js` adds `@testing-library/jest-dom`
matchers, polyfills `crypto.randomUUID` when jsdom lacks it, and clears
`localStorage`/`sessionStorage` before every test.

**Test coverage map**

| Spec | Business logic under test |
| --- | --- |
| `src/utils/validation.test.js` | `expenseSchema` / `expenseFormSchema`: title trimming, 80-char cap, negative & non-finite amounts, strict `YYYY-MM-DD` calendar dates, category/type enums, `validateExpense` error keys, fail-closed `sanitizeStoredExpenses` |
| `src/utils/formatters.test.js` | `formatCurrency` (PHP default, USD override, compact, symbol fallback), `formatSignedCurrency`, `parseDate`/`toISODate`/`getTodayISO`, `formatDate`/`formatFriendlyDate`, `formatPercent` |
| `src/context/ExpenseContext.test.jsx` | `addExpense`/`updateExpense`/`deleteExpense` state transitions + persistence, derived metrics, `dailyAllowance` warning/breach alerts (0 = unlimited), `updateSettings`/`clearAllData` |
| `src/components/forms/ModalA11y.test.jsx` | WCAG keyboard contract: labels, autofocus, Tab trap, Escape layering, focus restore, Enter-to-submit |

**Deployment (Vercel):** static SPA — `vercel.json` rewrites every path to
`index.html`; `npm run build` output in `/dist` is the deployable artifact
(entry + `forms`/`zod`/`lucide`/`vendor` chunks, `CategoryChart` lazy chunk)
plus the PWA artifacts (`manifest.webmanifest`, `sw.js`, `workbox-*.js`,
`registerSW.js`, `icons/*`). Vercel resolves files before the rewrite, so the
service worker and manifest are served from disk — never rewritten to
`index.html`. No environment variables, no server functions.

**Offline behaviour:** the service worker precaches the HTML shell, every hashed
chunk, CSS and both icons on first load, then serves them from cache. Route
changes and navigation fall back to the precached `index.html` (denylisted only
for `sw.js`, `registerSW.js`, `manifest.webmanifest`); other same-origin GETs use
`StaleWhileRevalidate`. `skipWaiting` + `clientsClaim` are on (`autoUpdate`), so
a new build takes over on the next reload. With zero external requests in the
bundle, the whole app works with the network off.

---

## 9. Phase Roadmap

| Phase | Deliverable | Status |
| --- | --- | --- |
| **Phase 1** | Architecture, folder structure, constants, formatters, Zod schemas, Vercel SPA config | ✅ Done |
| Phase 2 | Layout shell, context providers, `useExpenses`/`useLocalStorage`, common components | ✅ Done |
| Phase 3 | Dashboard summary cards + donut chart + allowance alerts | ✅ Done |
| Phase 4 | Add/Edit/Delete expense modal forms | ✅ Done |
| Phase 5 | Filterable transaction history + settings page | ✅ Done |
| Phase 6 | Polish: responsive passes, a11y, empty states, deploy to Vercel | ✅ Done |
| **Phase 5 QA gate** | Vitest suite (74 tests), WCAG 2.1 AA keyboard/focus audit, `npm run audit` + `npm run build` verification | ✅ Done |
| **Phase 6 (PWA + CI)** | `vite-plugin-pwa` manifest + Workbox offline caching, generated 192/512 icons, `.github/workflows/ci.yml` (Node 22, `npm ci`, audit, build) | ✅ Done |

**Current status:** Production-Ready / PWA-Enabled.
