/**
 * Gasto Buster — Header layout component.
 *
 * Branding (mobile/tablet; the sidebar carries it ≥ lg), a hamburger
 * that opens the navigation drawer (< lg), a visual daily budget
 * progress indicator (danger once the cap is breached), a Settings
 * trigger, and the Reset All Data action with a two-step confirmation.
 * Full-width with fluid --gutter padding; safe-area aware when
 * installed as a PWA.
 */

import { Wallet, Settings, RotateCcw, Menu } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ALLOWANCE_THRESHOLDS } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import Button from '../ui/Button.jsx';

/**
 * @param {{
 *   onOpenSettings: () => void,
 *   onResetData: () => void,
 *   resetPending?: boolean,
 *   onOpenNav?: () => void,
 * }} props
 */
export default function Header({
  onOpenSettings,
  onResetData,
  resetPending = false,
  onOpenNav,
}) {
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
    ? 'bg-danger'
    : isWarning
      ? 'bg-accent'
      : hasCap
        ? 'bg-success'
        : 'bg-gray-700';

  const labelColor = isOverDailyLimit
    ? 'text-danger'
    : isWarning
      ? 'text-accent'
      : hasCap
        ? 'text-success'
        : 'text-gray-500';

  return (
    <header className="sticky top-0 z-40 border-b border-onyx-line bg-base/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex items-center justify-between gap-[var(--space-3)] px-[var(--gutter)] py-[var(--space-3)]">
        {/* Drawer toggle (< lg) */}
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open navigation menu"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-onyx-soft hover:text-gray-100 lg:hidden ${FOCUS_RING_CLASSES}`}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* Brand (< lg) / page label (≥ lg, brand lives in the sidebar) */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-on-yellow lg:hidden">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 lg:hidden">
            <h1 className="text-lg font-bold leading-tight text-gray-100">
              Gasto Buster
            </h1>
            <p className="text-xs text-gray-500">Student Expense Tracker</p>
          </div>
          <p className="hidden text-sm font-semibold text-gray-300 lg:block">
            Dashboard
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSettings}
            aria-haspopup="dialog"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Button
            variant={resetPending ? 'danger-solid' : 'danger'}
            size="sm"
            onClick={onResetData}
            aria-label={
              resetPending
                ? 'Confirm resetting all data'
                : 'Reset all data. Requires a second press to confirm.'
            }
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {resetPending ? 'Confirm reset?' : 'Reset All Data'}
            </span>
          </Button>
        </div>
      </div>

      {/* Daily Budget Progress Bar */}
      <div className="border-t border-onyx-line bg-surface px-[var(--gutter)] py-[var(--space-2)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">
            Today
          </span>
          <div
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-onyx-soft"
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
                <span className="ml-1 font-normal text-gray-500">
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
