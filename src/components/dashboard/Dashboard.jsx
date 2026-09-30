/**
 * Gasto Buster — Dashboard component.
 *
 * Main dashboard view: assembles Header, BudgetBanner, SummaryCards,
 * CategoryChart, TransactionList, the ExpenseFormModal add/edit triggers,
 * the SettingsModal, and global keyboard shortcuts (N / + opens the add
 * form; Esc is handled by each open modal).
 */

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '../layout/Header.jsx';
import BudgetBanner from './BudgetBanner.jsx';
import SummaryCards from './SummaryCards.jsx';
import ChartSkeleton from '../common/ChartSkeleton.jsx';
import TransactionList from './TransactionList.jsx';
import ExpenseFormModal from '../forms/ExpenseFormModal.jsx';
import SettingsModal from '../forms/SettingsModal.jsx';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import PageShell from '../ui/PageShell.jsx';
import Button from '../ui/Button.jsx';
import Stack from '../ui/Stack.jsx';

// Code-split Recharts: only reachable through this lazy boundary, so the
// chart library loads in parallel instead of blocking the entry bundle.
const CategoryChart = lazy(() => import('./CategoryChart.jsx'));

const RESET_CONFIRM_MS = 4000;

/** Keys that should never trigger the add-transaction shortcut. */
function isTypingTarget(target) {
  if (!target) return false;
  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable === true
  );
}

export default function Dashboard() {
  const { clearAllData, categoryTotals } = useExpenseContext();
  const chartRowCount = Object.keys(categoryTotals).length;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [resetPending, setResetPending] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    []
  );

  const openAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  // Global shortcut: N or + opens the add form (unless typing or a modal is open).
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.isComposing
      ) {
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (isModalOpen || isSettingsOpen) return;

      if (event.key === 'n' || event.key === 'N' || event.key === '+' || event.key === '=') {
        event.preventDefault();
        openAddModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, isSettingsOpen]);

  // Two-step confirmation: first arm, second press wipes local data.
  const handleResetData = () => {
    if (resetPending) {
      clearAllData();
      setResetPending(false);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      return;
    }

    setResetPending(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setResetPending(false), RESET_CONFIRM_MS);
  };

  return (
    <PageShell
      header={
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetData={handleResetData}
          resetPending={resetPending}
        />
      }
    >
      {/* Daily allowance status */}
      <BudgetBanner onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Add Transaction trigger */}
      <Stack gap="3" row className="justify-end">
        <Button
          onClick={openAddModal}
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
      <SummaryCards />

      {/* Category donut chart (lazy chunk; skeleton reserves its layout) */}
      <Suspense fallback={<ChartSkeleton rows={chartRowCount} />}>
        <CategoryChart />
      </Suspense>

      {/* Searchable / sortable transaction history */}
      <TransactionList onEdit={openEditModal} />

      {/* Add / Edit modal */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editExpense={editingExpense}
      />

      {/* Settings modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </PageShell>
  );
}
