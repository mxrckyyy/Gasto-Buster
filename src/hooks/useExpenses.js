/**
 * Gasto Buster — useExpenses hook.
 *
 * CRUD operations on localStorage-backed expense records.
 * All writes pass through Zod validation before persisting.
 * On initial mount, stored records are sanitized to fail-closed against
 * corrupted or stale data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from './useLocalStorage.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants/categories.js';
import {
  validateExpense,
  validateExpenseRecord,
  sanitizeStoredExpenses,
  sanitizeStoredSettings,
} from '../utils/validation.js';

/**
 * @returns {{
 *   expenses: object[],
 *   settings: object,
 *   isLoading: boolean,
 *   addExpense: (data: object) => { success: boolean, data?: object, errors?: object },
 *   updateExpense: (id: string, fields: object) => { success: boolean, data?: object, errors?: object },
 *   deleteExpense: (id: string) => boolean,
 *   updateSettings: (fields: object) => void,
 *   clearAllData: () => void,
 * }}
 */
export default function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage(STORAGE_KEYS.expenses, []);
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Sanitize stored records + settings on mount — fail-closed against
  // corrupted or hand-edited localStorage.
  useEffect(() => {
    const sanitized = sanitizeStoredExpenses(expenses);
    if (sanitized.length !== expenses.length) {
      setExpenses(sanitized);
    }

    const sanitizedSettings = sanitizeStoredSettings(settings);
    if (JSON.stringify(sanitizedSettings) !== JSON.stringify(settings)) {
      setSettings(sanitizedSettings);
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Add a new expense record.
   * Validates input, generates a unique id, attaches createdAt, and persists.
   *
   * @param {object} expenseData - Raw form payload (title, amount, category, type, date, note?).
   * @returns {{ success: boolean, data?: object, errors?: object }}
   */
  const addExpense = useCallback(
    (expenseData) => {
      const validation = validateExpense(expenseData);
      if (!validation.success) {
        return { success: false, errors: validation.errors };
      }

      const now = new Date().toISOString();
      const newRecord = {
        ...validation.data,
        id: crypto.randomUUID(),
        createdAt: now,
      };

      setExpenses((prev) => [newRecord, ...prev]);
      return { success: true, data: newRecord };
    },
    [setExpenses]
  );

  /**
   * Update an existing expense record by ID.
   * Validates the merged record before persisting.
   *
   * @param {string} id - The record id to update.
   * @param {object} updatedFields - Fields to merge into the existing record.
   * @returns {{ success: boolean, data?: object, errors?: object }}
   */
  const updateExpense = useCallback(
    (id, updatedFields) => {
      const existing = expenses.find((expense) => expense.id === id);
      if (!existing) {
        return { success: false, errors: { id: 'Expense not found.' } };
      }

      const merged = { ...existing, ...updatedFields, id };
      const validation = validateExpenseRecord(merged);
      if (!validation.success) {
        return { success: false, errors: validation.errors };
      }

      const updatedRecord = {
        ...validation.data,
        updatedAt: new Date().toISOString(),
      };

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? updatedRecord : expense))
      );
      return { success: true, data: updatedRecord };
    },
    [expenses, setExpenses]
  );

  /**
   * Delete an expense record by ID.
   *
   * @param {string} id - The record id to delete.
   * @returns {boolean} Whether the record was found and removed.
   */
  const deleteExpense = useCallback(
    (id) => {
      const exists = expenses.some((expense) => expense.id === id);
      if (!exists) return false;

      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      return true;
    },
    [expenses, setExpenses]
  );

  /**
   * Merge partial settings into the current settings object.
   * The merged object is re-validated field-by-field before persisting.
   *
   * @param {object} fields - Settings fields to update.
   */
  const updateSettings = useCallback(
    (fields) => {
      setSettings((prev) => sanitizeStoredSettings({ ...prev, ...fields }));
    },
    [setSettings]
  );

  /**
   * Clear all locally stored data: transactions are removed and settings
   * are restored to their defaults.
   */
  const clearAllData = useCallback(() => {
    setExpenses([]);
    setSettings(sanitizeStoredSettings(DEFAULT_SETTINGS));
  }, [setExpenses, setSettings]);

  return useMemo(
    () => ({
      expenses,
      settings,
      isLoading,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearAllData,
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
    ]
  );
}
