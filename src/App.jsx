/**
 * Gasto Buster — App shell.
 *
 * Owns the application chrome: PageShell (sidebar rail + mobile drawer),
 * Header, Sidebar, the Add/Edit + Settings modals, the global keyboard
 * shortcut (N / +), and the two-step data-reset confirmation. Main content
 * is the Dashboard view; the period reports view swaps in here later
 * (view state lives in App).
 *
 * Global expense state is provided by <ExpenseProvider> in main.jsx.
 */

import { useEffect, useRef, useState } from 'react';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import ExpenseFormModal from './components/forms/ExpenseFormModal.jsx';
import SettingsModal from './components/forms/SettingsModal.jsx';
import useExpenseContext from './hooks/useExpenseContext.js';
import PageShell from './components/ui/PageShell.jsx';

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

export default function App() {
  const { clearAllData } = useExpenseContext();

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
      header={({ openNav }) => (
        <Header
          onOpenNav={openNav}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetData={handleResetData}
          resetPending={resetPending}
        />
      )}
      sidebar={({ collapsed, toggle, closeNav }) => (
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          onCloseNav={closeNav}
          onAddExpense={openAddModal}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
    >
      {/* Main content view (period reports swap in here later) */}
      <Dashboard
        onAddExpense={openAddModal}
        onEdit={openEditModal}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

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
