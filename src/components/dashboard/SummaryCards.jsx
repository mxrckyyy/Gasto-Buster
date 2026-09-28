/**
 * Gasto Buster — SummaryCards component.
 *
 * Three stat cards: Net Balance (green/red), Total Income (green),
 * Total Expenses (rose). All values go through formatCurrency().
 */

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';

export default function SummaryCards() {
  const { netBalance, totalIncome, totalExpense, settings } = useExpenseContext();

  const currencyOpts = { currency: settings.currency, locale: settings.locale };

  const isPositive = netBalance >= 0;

  const cards = [
    {
      label: 'Total Net Balance',
      caption: 'Income minus expenses',
      value: formatCurrency(netBalance, currencyOpts),
      icon: Wallet,
      valueClass: isPositive ? 'text-emerald-400' : 'text-red-400',
      iconClass: isPositive
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'bg-red-500/10 text-red-400',
      accentClass: isPositive ? 'bg-emerald-500' : 'bg-red-500',
    },
    {
      label: 'Total Income',
      caption: 'Money in',
      value: formatCurrency(totalIncome, currencyOpts),
      icon: TrendingUp,
      valueClass: 'text-emerald-400',
      iconClass: 'bg-emerald-500/10 text-emerald-400',
      accentClass: 'bg-emerald-500',
    },
    {
      label: 'Total Expenses',
      caption: 'Money out',
      value: formatCurrency(totalExpense, currencyOpts),
      icon: TrendingDown,
      valueClass: 'text-rose-400',
      iconClass: 'bg-rose-500/10 text-rose-400',
      accentClass: 'bg-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5"
        >
          <span
            className={`absolute inset-x-0 top-0 h-0.5 ${card.accentClass}`}
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {card.label}
              </p>
              <p className={`mt-2 text-xl font-bold tabular-nums ${card.valueClass}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.caption}</p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
            >
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
