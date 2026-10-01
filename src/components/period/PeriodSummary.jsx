/**
 * Gasto Buster — PeriodSummary.
 *
 * Card with the period's total spend and the comparison to the previous
 * equivalent period: "vs previous week + ₱120.00 (+13%)".
 *
 * Delta tones: positive → --success, negative → --danger, zero → gray.
 * A null percent (previous period had nothing to compare against) renders
 * as the gray em dash "—" instead of NaN/Infinity.
 */

import Card from '../ui/Card.jsx';
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters.js';
import { cn } from '../../utils/cn.js';

/**
 * @param {{
 *   spent: number,
 *   delta: { absolute: number, percent: number | null },
 *   type: 'week' | 'month',
 *   currency?: string,
 *   locale?: string,
 * }} props
 */
export default function PeriodSummary({ spent, delta, type, currency, locale }) {
  const moneyOptions = { currency, locale };
  const noun = type === 'month' ? 'month' : 'week';
  const { absolute, percent } = delta;

  const toneClass =
    absolute > 0 ? 'text-success' : absolute < 0 ? 'text-danger' : 'text-gray-500';

  // formatSignedCurrency derives its +/- from `type`, so map the delta's
  // sign onto the type the way the transaction rows do; zero is unsigned.
  const absoluteLabel =
    absolute === 0
      ? formatCurrency(0, moneyOptions)
      : formatSignedCurrency(absolute, {
          type: absolute > 0 ? 'income' : 'expense',
          ...moneyOptions,
        });

  const percentLabel =
    percent === null ? '—' : `${percent > 0 ? '+' : ''}${formatPercent(percent, { locale })}`;

  return (
    <Card as="section" pad={4}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Total spent
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-100">
        {formatCurrency(spent, moneyOptions)}
      </p>
      <p className={cn('mt-1 text-sm font-medium tabular-nums', toneClass)}>
        vs previous {noun} {absoluteLabel} ({percentLabel})
      </p>
    </Card>
  );
}
