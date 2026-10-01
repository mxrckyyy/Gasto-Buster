/**
 * Gasto Buster — Dashboard view content.
 *
 * Main dashboard content: BudgetBanner, the Add Transaction trigger,
 * Summary Cards, the lazy Category Chart, and the Transaction List.
 * The shell (PageShell, Header, Sidebar, modals, global shortcuts) lives
 * in App.jsx — this view receives its actions as props so the lift is
 * behavior-neutral.
 */

import { lazy, Suspense } from 'react';
import { Plus } from 'lucide-react';
import BudgetBanner from './BudgetBanner.jsx';
import SummaryCards from './SummaryCards.jsx';
import ChartSkeleton from '../common/ChartSkeleton.jsx';
import TransactionList from './TransactionList.jsx';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import Button from '../ui/Button.jsx';
import Stack from '../ui/Stack.jsx';

// Code-split Recharts: only reachable through this lazy boundary, so the
// chart library loads in parallel instead of blocking the entry bundle.
const CategoryChart = lazy(() => import('./CategoryChart.jsx'));

/**
 * @param {{
 *   onAddExpense: () => void,
 *   onEdit: (expense: object) => void,
 *   onOpenSettings: () => void,
 * }} props
 */
export default function Dashboard({ onAddExpense, onEdit, onOpenSettings }) {
  const { categoryTotals } = useExpenseContext();
  const chartRowCount = Object.keys(categoryTotals).length;

  return (
    <>
      {/* Daily allowance status */}
      <BudgetBanner onOpenSettings={onOpenSettings} />

      {/* Add Transaction trigger */}
      <Stack gap="3" row className="justify-end">
        <Button
          onClick={onAddExpense}
          title="Add transaction (keyboard shortcut: N)"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add Transaction
          <kbd className="hidden rounded border border-on-yellow/30 bg-on-yellow/10 px-1.5 py-0.5 text-[10px] font-semibold text-on-yellow sm:inline">
            N
          </kbd>
        </Button>
      </Stack>

      {/* Summary cards */}
      <div id="summary-cards" className="scroll-mt-28">
        <SummaryCards />
      </div>

      {/* Category donut chart (lazy chunk; skeleton reserves its layout) */}
      <div id="spending-category" className="scroll-mt-28">
        <Suspense fallback={<ChartSkeleton rows={chartRowCount} />}>
          <CategoryChart />
        </Suspense>
      </div>

      {/* Searchable / sortable transaction history */}
      <div id="transaction-history" className="scroll-mt-28">
        <TransactionList onEdit={onEdit} />
      </div>
    </>
  );
}
