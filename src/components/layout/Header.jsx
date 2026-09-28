/**
 * Gasto Buster — Header layout component.
 *
 * Branding, a visual daily budget progress indicator (red once the cap is
 * breached), a Settings trigger (opens the Settings modal), and the Reset
 * All Data action with a two-step confirmation.
 */

import { Wallet, Settings, RotateCcw } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ALLOWANCE_THRESHOLDS } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';

/**
 * @param {{
 *   onOpenSettings: () => void,
 *   onResetData: () => void,
 *   resetPending?: boolean,
 * }} props
 */
export default function Header({ onOpenSettings, onResetData, resetPending = false }) {
  const { todaySpent, isOverDailyLimit, settings } = useExpenseContext();
  const { currency, locale, dailyAllowance } = settings;

  const cap = Number(dailyAllowance) || 0;
  const hasCap = cap > 0;
  const ratio = hasCap ? todaySpent / cap : 0;
  const progressPercent = hasCap ? Math.min(ratio * 100, 100) : 0;
  const isWarning =
    hasCap && !isOverDailyLimit && ratio >= ALLOWANCE_THRESHOLDS.warning;

  const money = (value) => formatCurrency(value, { currency, locale });

  const barColor = isOverDailyLimit
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : hasCap
        ? 'bg-emerald-500'
        : 'bg-slate-600';

  const labelColor = isOverDailyLimit
    ? 'text-red-400'
    : isWarning
      ? 'text-amber-400'
      : hasCap
        ? 'text-emerald-400'
        : 'text-slate-400';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight text-white">
              Gasto Buster
            </h1>
            <p className="text-xs text-slate-400">Student Expense Tracker</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-haspopup="dialog"
            aria-label="Open settings"
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white ${FOCUS_RING_CLASSES}`}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={onResetData}
            aria-label={
              resetPending
                ? 'Confirm resetting all data'
                : 'Reset all data. Requires a second press to confirm.'
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${FOCUS_RING_CLASSES} ${
              resetPending
                ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
                : 'border-red-900/50 bg-red-950/50 text-red-400 hover:bg-red-950 hover:text-red-300'
            }`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {resetPending ? 'Confirm reset?' : 'Reset All Data'}
            </span>
          </button>
        </div>
      </div>

      {/* Daily Budget Progress Bar */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-4">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
            Today
          </span>
          <div
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Daily budget used"
            aria-valuemin={0}
            aria-valuemax={hasCap ? 100 : undefined}
            aria-valuenow={hasCap ? Math.round(progressPercent) : undefined}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span
            className={`shrink-0 text-xs font-semibold tabular-nums ${labelColor}`}
          >
            {hasCap ? (
              <>
                {money(todaySpent)}
                {' / '}
                {money(cap)}
                {isOverDailyLimit && (
                  <span className="ml-1 font-bold">
                    (+{money(todaySpent - cap)} over)
                  </span>
                )}
              </>
            ) : (
              <>
                {money(todaySpent)}
                <span className="ml-1 font-normal text-slate-500">
                  · no cap set
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
