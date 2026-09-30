/**
 * Gasto Buster — BudgetBanner component.
 *
 * Daily allowance status banner rendered at the top of the dashboard:
 *   - Safe (0%–79%):    success theme, "Within daily allowance"
 *   - Warning (80%–99%): yellow accent theme, "Nearing daily allowance cap"
 *   - Exceeded (100%+):  danger theme,  "Daily allowance exceeded!"
 *   - No cap configured: neutral onyx theme with a Settings shortcut.
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
import Button from '../ui/Button.jsx';
import Chip from '../ui/Chip.jsx';

const THEMES = {
  safe: {
    Icon: CheckCircle2,
    role: 'status',
    message: 'Within daily allowance',
    wrapper: 'border-success/30 bg-success/10',
    iconWrap: 'bg-success/15 text-success',
    title: 'text-success',
    detail: 'text-success',
    chip: 'success',
    bar: 'bg-success',
  },
  warning: {
    Icon: AlertTriangle,
    role: 'status',
    message: 'Nearing daily allowance cap',
    wrapper: 'border-accent/40 bg-accent/10',
    iconWrap: 'bg-accent/15 text-accent',
    title: 'text-accent',
    detail: 'text-accent',
    chip: 'accent',
    bar: 'bg-accent',
  },
  exceeded: {
    Icon: AlertOctagon,
    role: 'alert',
    message: 'Daily allowance exceeded!',
    wrapper: 'border-danger/40 bg-danger/10',
    iconWrap: 'bg-danger/15 text-danger',
    title: 'text-danger',
    detail: 'text-danger',
    chip: 'danger',
    bar: 'bg-danger',
  },
  neutral: {
    Icon: Info,
    role: 'status',
    message: 'Daily allowance not set',
    wrapper: 'border-onyx-line bg-inset',
    iconWrap: 'bg-onyx-soft text-gray-500',
    title: 'text-gray-100',
    detail: 'text-gray-500',
    chip: 'neutral',
    bar: 'bg-gray-700',
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
      className={`rounded-2xl border p-[var(--space-4)] ${theme.wrapper}`}
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
            <Chip tone={theme.chip}>{percentUsed}% used</Chip>
          ) : (
            onOpenSettings && (
              <Button variant="secondary" size="sm" onClick={onOpenSettings}>
                Open Settings
              </Button>
            )
          )}
        </div>
      </div>

      {hasCap && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-base/60"
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
