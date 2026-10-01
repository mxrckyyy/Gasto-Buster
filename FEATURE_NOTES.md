# Feature Notes — Period View (Week/Month) + CSV Export

Implements the period-view + client-side CSV export spec on top of the
local-first dashboard. JavaScript + JSX only — see *TypeScript revert*
below for why.

## Files added

| File | Purpose |
| --- | --- |
| `src/lib/periods.js` (+ `periods.test.js`, 30 tests) | Pure period math: Mon–Sun weeks + calendar months (local time), prev/next navigation, inclusive range filtering, sums, category grouping, `computeDelta`, ISO 8601 weeks (`toISOWeek`) |
| `src/lib/export.js` (+ `export.test.js`, 19 tests) | Pure `toCSV` / `buildFilename` + offline `downloadFile` (Blob + object URL) |
| `src/hooks/usePeriod.js` | `{ type, anchorDate }` state persisted to `localStorage['gb.period']` + memoized derivations (range, filtered records, totals, delta, chart totals) |
| `src/components/period/PeriodSwitcher.jsx` | Week/Month segmented control — ARIA tablist, roving tabindex, Arrow/Home/End keys |
| `src/components/period/PeriodNavigator.jsx` | Prev / aria-live label / Next / Today; 44×44 ghost icon buttons |
| `src/components/period/PeriodSummary.jsx` | Total spent + "vs previous week/month ±amount (±%)" card |
| `src/components/period/PeriodsView.jsx` | The Reports screen: `#period-panel` composing the above + shared chart/list |
| `src/components/period/ExportMenu.jsx` | Trigger + focus-trapped Sheet with exactly two CSV items + live-region announcement |
| `src/App.test.jsx` (6 tests) | Full-shell wiring: view swap, controls, fixture totals, export menu/download, zero-warning render |

## Files changed

- `src/App.jsx` — shell lift: now owns PageShell/Header/Sidebar/modals/`N`+`+`
  shortcut/reset confirm; holds `view` state (`'dashboard' ⇄ 'periods'`,
  an in-place swap — no router) and renders `Dashboard` or `PeriodsView`.
- `src/components/dashboard/Dashboard.jsx` — shell removed; view-only content
  receiving `onAddExpense` / `onEdit` / `onOpenSettings` as props. Behavior and
  markup identical beyond the lift.
- `src/components/layout/Sidebar.jsx` — new **Reports** nav item (view swap);
  section-jump anchors now swap back to the dashboard first (then
  `scrollIntoView`); shared `navItemClass()` for anchors + Reports; new
  `view` / `onNavigate` props.
- `src/components/dashboard/CategoryChart.jsx` — optional `categoryTotals`
  prop (context totals remain the default → dashboard unchanged).
- `src/components/dashboard/TransactionList.jsx` — optional `expenses`
  (period slice) + `showExport = true` props; legacy export button hidden on
  the period view only.
- `src/utils/formatters.js` (+ 4 tests) — `formatPeriodLabel`
  ("Sep 22 – Sep 28, 2025" / "September 2025").
- `vitest.setup.js` — jsdom stubs: `ResizeObserver` (Recharts), `vi.fn()`
  `Element.prototype.scrollIntoView`.
- `ARCHITECTURE.md` — "Period view + Export" subsection, directory/feature
  entries, test-coverage rows, roadmap row.

No new dependencies. No config changes: `vitest.config.js` already includes
`{js,jsx}` and `scripts/audit.cjs` keeps its original `.js/.jsx` filter.

## Decisions (locked)

- Periods: **calendar** week (Monday–Sunday) + **calendar** month (1st–last),
  local time; ISO 8601 week labels (week 1 = week with the first Thursday).
- View placement: **shell lifted to App** (Option 1, confirmed) — App owns the
  chrome, views swap in place; Dashboard stays behavior-identical.
- Export: **CSV only**, two scopes ("this period" + "all data"), exact 7-column
  schema; no JSON/PDF, no BOM.
- `TransactionList` gets `showExport` (default `true`) so the dashboard keeps
  its legacy button; the period view passes `false`.
- Period totals, chart, and delta count `type === 'expense'` only; the
  transaction list and CSV rows include income records too.
- `computeDelta.percent` is a **ratio** (0.13 → "+13%" via `formatPercent`);
  previous = 0 → `percent: null` → rendered "—".
- `toCSV` takes `{ categories, currency }` (`currency` defaults to `PHP`) so
  the Currency column reflects settings; spec's `{ categories }` shape still
  works unchanged.
- CSV `Description` ← `title` (the schema has no `description` field; `note`
  is intentionally not exported — see follow-ups).
- Rows preserve input order (no re-sorting).
- `gb.period` persists like `gb.sidebar` (the app already persists UI state);
  corrupt/missing storage fails closed to week-of-today.

## CSV rationale

- **Exact header + CRLF** — Excel/Sheets/Numbers import cleanly; contract is
  byte-checkable (tested).
- **Bare 2-decimal amounts** — no ₱ symbol or thousands separators, so the
  column parses as a number and `SUM` works.
- **Category label, not id** — readable for humans; ids would leak internal
  names into user data.
- **Precomputed `Week` / `Month` columns** — pivot/group without date parsing.
- **Quote only when needed** (comma/quote/newline; quotes doubled) — minimal
  quoting keeps diffs and eyeballing readable while staying RFC-safe.
- **No BOM** — the spec fixes the header bytes; Excel's ₱ handling in legacy
  encodings is a known trade-off (below).

## Known follow-ups

1. **Unify export schemas** — the dashboard's legacy `utils/exportCsv.js`
   (6 columns: Date/Type/Category/Title/Amount/Note, BOM, sorted newest-first)
   differs from `lib/export.js` (7 columns, no BOM, input order). Two buttons,
   two shapes. Consolidate on `lib/export.js` and drop `exportCsv.js` once the
   dashboard is migrated.
2. **CSV + non-ASCII currency in Excel** — no UTF-8 BOM; some Windows Excel
   locales may show ₱ oddly without it. Add a BOM only if reported (would
   deviate from the exact-header spec).
3. **`note` column** — omitted from the 7-column schema; re-add via
   `lib/export.js` only if the contract grows.
4. **Empty-period copy** — on an empty period the shared chart/list show their
   all-time empty-state copy ("No expense data yet" / "No transactions yet")
   rather than period-specific wording; components stay unforked by design.
5. **CI test step** — `.github/workflows/ci.yml` still runs only audit + build;
   add `npm test` now that the suite is 133 tests.

## TypeScript revert (note)

The first pass of this feature was mistakenly written in TypeScript
(`src/lib/periods.ts`, `src/lib/export.ts`, `src/hooks/usePeriod.ts` + `.test.ts`
files, an `audit.cjs` `.ts/.tsx` scan tweak). The project is **JavaScript +
React (JSX) only**, so before redoing the work:

- **Removed:** all five `.ts` files (`periods.ts`, `periods.test.ts`,
  `export.ts`, `export.test.ts`, `usePeriod.ts`) and the `audit.cjs` scan
  change. No `tsconfig.json` was ever added and no `typescript`/`@types/*`
  dependencies ever touched `package.json` (verified).
- **Method:** `git reset --hard 7a11204` (the commit before the feature
  started) — local-only history, never pushed, so nothing needed force-updating
  and no pre-existing `.ts`/`.tsx` files existed in the repo.
- **Restored (in JS):** the whole feature rebuilt as `periods.js`,
  `export.js`, `usePeriod.js` with JSDoc instead of type annotations, the same
  test coverage in `.test.js` files, and the original `.js/.jsx`-only audit
  filter. `ARCHITECTURE.md`/`FEATURE_NOTES.md` document the JS versions.

## Verification

- `npm run audit` — clean.
- `npm test` — **133 passing** (74 pre-existing + 59 new: 30 periods,
  19 export, 4 formatters, 6 full-shell).
- `npm run build` — succeeds; PWA assets emitted (`sw.js`, `workbox-*.js`,
  `manifest.webmanifest`).
- No `.ts`/`.tsx` files, no `tsconfig.json`, no TS dependencies.
