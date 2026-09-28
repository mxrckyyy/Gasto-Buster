/**
 * Gasto Buster — CategoryChart component.
 *
 * Interactive donut chart using Recharts showing expense distribution
 * across categories. Slices use the hex colors declared in
 * src/constants/categories.js; the legend and tooltip show both the
 * percentage and the total spent per category.
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { CATEGORY_MAP } from '../../constants/categories.js';
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from '../../utils/formatters.js';

/** Custom tooltip showing category name, amount, and percentage. */
function ChartTooltip({ active, payload, settings }) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0].payload;
  const currencyOpts = { currency: settings.currency, locale: settings.locale };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        {entry.name}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        {formatCurrency(entry.value, currencyOpts)}
        {' · '}
        {formatPercent(entry.percent, { locale: settings.locale })} of spending
      </p>
    </div>
  );
}

export default function CategoryChart() {
  const { categoryTotals, settings } = useExpenseContext();
  const currencyOpts = { currency: settings.currency, locale: settings.locale };

  const data = Object.entries(categoryTotals)
    .map(([categoryId, total]) => {
      const category = CATEGORY_MAP[categoryId];
      return {
        id: categoryId,
        name: category?.label ?? categoryId,
        value: total,
        color: category?.color ?? '#64748B',
        percent: 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalSpent = data.reduce((sum, entry) => sum + entry.value, 0);
  data.forEach((entry) => {
    entry.percent = totalSpent > 0 ? entry.value / totalSpent : 0;
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-700">
          <PieChartIcon className="h-9 w-9 text-slate-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-400">
          No expense data yet
        </p>
        <p className="mt-1 max-w-xs text-xs text-slate-600">
          Add your first expense and the donut will break down exactly where
          your money goes.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Spending by Category
      </h3>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        {/* Donut — the legend below carries the same data for screen readers */}
        <div className="relative h-56 w-56 shrink-0">
          <div className="h-full w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip settings={settings} />}
                  cursor={{ fill: 'transparent' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Total spent
            </span>
            <span className="text-lg font-bold text-white">
              {formatCompactCurrency(totalSpent, currencyOpts)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full flex-1 space-y-2">
          {data.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-sm text-slate-300">
                  {entry.name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-sm">
                <span className="tabular-nums text-slate-500">
                  {formatPercent(entry.percent, { locale: settings.locale })}
                </span>
                <span className="font-medium tabular-nums text-slate-200">
                  {formatCurrency(entry.value, currencyOpts)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
