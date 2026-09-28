/**
 * Gasto Buster — ExpenseContext.
 *
 * React Context provider that eliminates prop drilling by exposing
 * expense state, settings, CRUD actions, and memoized derived metrics
 * to the entire component tree.
 */

import { createContext, useMemo } from 'react';
import useExpenses from '../hooks/useExpenses.js';
import { getTodayISO } from '../utils/formatters.js';

/** @type {React.Context<import('../hooks/useExpenses.js').default extends () => infer R ? R : never>} */
const ExpenseContext = createContext(null);

/**
 * Provider component that wraps the app and supplies expense state + actions.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function ExpenseProvider({ children }) {
  const {
    expenses,
    settings,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    updateSettings,
    clearAllData,
  } = useExpenses();

  // --- Derived Metrics (memoized) ---

  /** Sum of all income items. */
  const totalIncome = useMemo(
    () =>
      expenses
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  /** Sum of all expense items. */
  const totalExpense = useMemo(
    () =>
      expenses
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  /** Net balance: totalIncome - totalExpense. */
  const netBalance = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  /** Total spent on today's ISO date. */
  const todaySpent = useMemo(() => {
    const today = getTodayISO();
    return expenses
      .filter((e) => e.type === 'expense' && e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  /**
   * Boolean flag: true when todaySpent exceeds a configured daily cap.
   * A cap of 0 means "no cap configured" — never reported as exceeded.
   */
  const isOverDailyLimit = useMemo(
    () => settings.dailyAllowance > 0 && todaySpent > settings.dailyAllowance,
    [todaySpent, settings.dailyAllowance]
  );

  /** Object aggregating spending totals grouped by category ID. */
  const categoryTotals = useMemo(() => {
    return expenses
      .filter((e) => e.type === 'expense')
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});
  }, [expenses]);

  const value = useMemo(
    () => ({
      // State
      expenses,
      settings,
      isLoading,
      // Actions
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearAllData,
      // Derived metrics
      totalIncome,
      totalExpense,
      netBalance,
      todaySpent,
      isOverDailyLimit,
      categoryTotals,
    }),
    [
      expenses,
      settings,
      isLoading,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearAllData,
      totalIncome,
      totalExpense,
      netBalance,
      todaySpent,
      isOverDailyLimit,
      categoryTotals,
    ]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export default ExpenseContext;
