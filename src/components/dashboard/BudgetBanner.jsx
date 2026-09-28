/**
 * Gasto Buster — BudgetBanner component.
 *
 * Daily allowance status banner rendered at the top of the dashboard:
 *   - Safe (0%–79%):   emerald theme, "Within daily allowance"
 *   - Warning (80%–99%): amber theme, "Nearing daily allowance cap"
 *   - Exceeded (100%+):  red theme,   "Daily allowance exceeded!"
 *   - No cap configured: neutral slate theme with a Settings shortcut.
 */

import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ALLOWANCE_THRESHOLDS } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';

const THEMES = {
  safe: {
    Icon: CheckCircle2,
    role: 'status',
    message: 'Within daily allowance',
    wrapper: 'border-emerald-500/30 bg-emerald-500/10',
    iconWrap: 'bg-emerald-500/15 text-emerald-400',
    title: 'text-emerald-300',
    detail: 'text-emerald-400/90',
    percent: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
  warning: {
    Icon: AlertTriangle,
    role: 'status',
    message: 'Nearing daily allowance cap',
    wrapper: 'border-amber-500/40 bg-amber-500/10',
    iconWrap: 'bg-amber-500/15 text-amber-400',
    title: 'text-amber-300',
    detail: 'text-amber-400/90',
    percent: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  exceeded: {
    Icon: AlertOctagon,
    role: 'alert',
    message: 'Daily allowance exceeded!',
    wrapper: 'border-red-500/40 bg-red-500/10',
    iconWrap: 'bg-red-500/15 text-red-400',
    title: 'text-red-300',
    detail: 'text-red-400/90',
    percent: 'text-red-300',
    bar: 'bg-red-500',
  },
  neutral: {
    Icon: Info,
    role: 'status',
    message: 'Daily allowance not set',
    wrapper: 'border-slate-700 bg-slate-900',
    iconWrap: 'bg-slate-800 text-slate-400',
    title: 'text-slate-200',
    detail: 'text-slate-400',
    percent: 'text-slate-300',
    bar: 'bg-slate-500',
  },
};

/**
 * @param {{ onOpenSettings?: () => void }} props
 */
export default function BudgetBanner({ onOpenSettings }) {
  const { todaySpent, settings, isOverDailyLimit } = useExpenseContext();

  const cap = Number(settings.dailyAllowance) || 0;
  const hasCap = cap > 0;
  const currencyOpts = { currency: settings.currency, locale: settings.locale };
  const money = (value) => formatCurrency(value, currencyOpts);

  let status = 'neutral';
  if (hasCap) {
    const ratio = todaySpent / cap;
    if (isOverDailyLimit || ratio >= ALLOWANCE_THRESHOLDS.exceeded) {
      status = 'exceeded';
    } else if (ratio >= ALLOWANCE_THRESHOLDS.warning) {
      status = 'warning';
    } else {
      status = 'safe';
    }
  }

  const theme = THEMES[status];
  const percentUsed = hasCap ? Math.round((todaySpent / cap) * 100) : 0;
  const barWidth = Math.min(percentUsed, 100);

  let detail;
  if (status === 'safe') {
    detail = `You've spent ${money(todaySpent)} of ${money(cap)} today.`;
  } else if (status === 'warning') {
    detail = `${money(cap - todaySpent)} left of your ${money(cap)} daily cap.`;
  } else if (status === 'exceeded') {
    detail = `You're ${money(todaySpent - cap)} over your ${money(cap)} daily cap.`;
  } else {
    detail =
      'Set a daily cap to get alerts as you approach your limit for the day.';
  }

  return (
    <section
      role={theme.role}
      className={`rounded-2xl border p-4 sm:p-5 ${theme.wrapper}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconWrap}`}
          >
            <theme.Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${theme.title}`}>
              {theme.message}
            </p>
            <p className={`mt-0.5 text-xs ${theme.detail}`}>{detail}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasCap ? (
            <span
              className={`text-sm font-bold tabular-nums ${theme.percent}`}
            >
              {percentUsed}% used
            </span>
          ) : (
            onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className={`rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white ${FOCUS_RING_CLASSES}`}
              >
                Open Settings
              </button>
            )
          )}
        </div>
      </div>

      {hasCap && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-black/20"
          role="progressbar"
          aria-label="Daily allowance used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(percentUsed, 100)}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
    </section>
  );
}
