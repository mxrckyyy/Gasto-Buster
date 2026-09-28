/**
 * Gasto Buster — ChartSkeleton component.
 *
 * Suspense fallback for the lazily-loaded CategoryChart. It mirrors the
 * chart's exact layout geometry — section frame, fixed h-56/w-56 donut box,
 * and 32px legend rows (text-sm line box + py-1.5) — so swapping the
 * fallback for the rendered chart produces zero cumulative layout shift.
 *
 * When `rows` is 0 the chart will render its empty state instead, so the
 * skeleton replicates that DOM structure invisibly: identical geometry,
 * no layout jump, no flash of placeholder text.
 */

import { PieChart as PieChartIcon } from 'lucide-react';

/** Same row box as the real legend: 20px line box + 6px vertical padding. */
const ROW_CLASSES = 'flex items-center justify-between gap-3 rounded-lg px-2 py-1.5';

/**
 * @param {{
 *   rows?: number,
 * }} props
 */
export default function ChartSkeleton({ rows = 0 }) {
  if (rows === 0) {
    // Hidden replica of CategoryChart's empty state — geometry must match exactly.
    return (
      <div
        aria-hidden="true"
        className="invisible flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-700">
          <PieChartIcon className="h-9 w-9 text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400">No expense data yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-600">
          Add your first expense and the donut will break down exactly where
          your money goes.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-busy="true"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Spending by Category
      </h3>
      <span className="sr-only">Loading category chart</span>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        {/* Donut placeholder — same fixed box as the real chart */}
        <div className="relative h-56 w-56 shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-44 w-44 animate-pulse rounded-full border-[10px] border-slate-800" />
          </div>
          {/* Center total placeholder (absolute — no layout impact) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="h-3 w-16 animate-pulse rounded bg-slate-800" />
            <span className="mt-1.5 h-5 w-24 animate-pulse rounded bg-slate-800" />
          </div>
        </div>

        {/* Legend placeholders — one row per category */}
        <ul className="w-full flex-1 space-y-2">
          {Array.from({ length: rows }, (_, index) => (
            <li key={index} className={ROW_CLASSES}>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-slate-800"
                />
                <span className="h-5 w-28 animate-pulse rounded bg-slate-800" />
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="h-5 w-10 animate-pulse rounded bg-slate-800" />
                <span className="h-5 w-16 animate-pulse rounded bg-slate-800" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
