/**
 * Gasto Buster — SummaryCards component.
 *
 * Three stat cards: Net Balance (green/red), Total Income (green),
 * Total Expenses (red). All values go through formatCurrency().
 * Grid fills the viewport width (1 → 2 → 3 columns).
 */

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';
import Card from '../ui/Card.jsx';
import Grid from '../ui/Grid.jsx';

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
      valueClass: isPositive ? 'text-success' : 'text-danger',
      iconClass: isPositive
        ? 'bg-success/10 text-success'
        : 'bg-danger/10 text-danger',
      accentClass: isPositive ? 'bg-success' : 'bg-danger',
    },
    {
      label: 'Total Income',
      caption: 'Money in',
      value: formatCurrency(totalIncome, currencyOpts),
      icon: TrendingUp,
      valueClass: 'text-success',
      iconClass: 'bg-success/10 text-success',
      accentClass: 'bg-success',
    },
    {
      label: 'Total Expenses',
      caption: 'Money out',
      value: formatCurrency(totalExpense, currencyOpts),
      icon: TrendingDown,
      valueClass: 'text-danger',
      iconClass: 'bg-danger/10 text-danger',
      accentClass: 'bg-danger',
    },
  ];

  return (
    <Grid cols="stats">
      {cards.map((card) => (
        <Card key={card.label} className="relative overflow-hidden">
          <span
            className={`absolute inset-x-0 top-0 h-0.5 ${card.accentClass}`}
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {card.label}
              </p>
              <p className={`mt-2 text-xl font-bold tabular-nums ${card.valueClass}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.caption}</p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
            >
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </Card>
      ))}
    </Grid>
  );
}
