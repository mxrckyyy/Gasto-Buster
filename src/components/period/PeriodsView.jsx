/**
 * Gasto Buster — PeriodsView (the Reports screen).
 *
 * Weekly/monthly reporting: segmented period switch, prev/next/Today
 * navigator with an aria-live range label, period total + delta card,
 * the shared CategoryChart filtered to the period, and the shared
 * TransactionList showing the same slice (legacy export button hidden —
 * the Reports header carries the dedicated Export menu instead).
 *
 * Reuses the existing chart and list components — no forks.
 */

import { lazy, Suspense } from 'react';
import ChartSkeleton from '../common/ChartSkeleton.jsx';
import TransactionList from '../dashboard/TransactionList.jsx';
import usePeriod from '../../hooks/usePeriod.js';
import { formatPeriodLabel } from '../../utils/formatters.js';
import PeriodSwitcher from './PeriodSwitcher.jsx';
import PeriodNavigator from './PeriodNavigator.jsx';
import PeriodSummary from './PeriodSummary.jsx';
import ExportMenu from './ExportMenu.jsx';

// Same lazy module the Dashboard uses (one shared chunk).
const CategoryChart = lazy(() => import('../dashboard/CategoryChart.jsx'));

/**
 * @param {{
 *   onEdit: (expense: object) => void,
 * }} props
 */
export default function PeriodsView({ onEdit }) {
  const {
    type,
    range,
    filteredExpenses,
    spent,
    delta,
    categoryTotals,
    currency,
    locale,
    setType,
    goPrev,
    goNext,
    goToToday,
  } = usePeriod();

  const label = formatPeriodLabel(range, { type, locale });

  return (
    <div
      id="period-panel"
      role="tabpanel"
      aria-labelledby={`period-tab-${type}`}
      className="flex flex-col gap-[var(--section-gap)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-100">Reports</h2>
        <ExportMenu />
      </div>

      <PeriodSwitcher type={type} onChange={setType} />

      <PeriodNavigator
        type={type}
        label={label}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToToday}
      />

      <PeriodSummary
        spent={spent}
        delta={delta}
        type={type}
        currency={currency}
        locale={locale}
      />

      {/* Category donut chart — shared component, period-scoped data */}
      <div id="period-chart">
        <Suspense
          fallback={<ChartSkeleton rows={Object.keys(categoryTotals).length} />}
        >
          <CategoryChart categoryTotals={categoryTotals} />
        </Suspense>
      </div>

      {/* Transaction history — shared component, period-scoped data */}
      <TransactionList
        expenses={filteredExpenses}
        showExport={false}
        onEdit={onEdit}
      />
    </div>
  );
}
