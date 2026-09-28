/**
 * Gasto Buster — TransactionList component.
 *
 * Filterable, sortable transaction history: search by title, filter by
 * category, toggle sort order (newest first / highest amount), and delete
 * with an inline confirmation step.
 */

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Pencil,
  Trash2,
  Receipt,
  Download,
} from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { ALL_CATEGORIES, CATEGORY_MAP } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import {
  formatSignedCurrency,
  formatFriendlyDate,
} from '../../utils/formatters.js';
import { exportToCsv } from '../../utils/exportCsv.js';
import CategoryIcon from '../common/CategoryIcon.jsx';

const CONTROL_CLASSES = `rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-indigo-500 ${FOCUS_RING_CLASSES}`;

/**
 * @param {{
 *   onEdit: (expense: object) => void,
 * }} props
 */
export default function TransactionList({ onEdit }) {
  const { expenses, deleteExpense, settings } = useExpenseContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'highest'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = expenses.filter((expense) => {
      const matchesSearch = !query || expense.title.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortOrder === 'highest') return b.amount - a.amount;
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });

    return result;
  }, [expenses, searchQuery, categoryFilter, sortOrder]);

  const handleDelete = (id) => {
    deleteExpense(id);
    setConfirmDeleteId(null);
  };

  const currencyOpts = { currency: settings.currency, locale: settings.locale };
  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'all';

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Transaction History
          </h3>
          <span className="text-xs tabular-nums text-slate-600">
            {filteredExpenses.length} of {expenses.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search by title */}
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search title..."
              aria-label="Search transactions by title"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`${CONTROL_CLASSES} w-full pl-9 sm:w-48`}
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
            className={`${CONTROL_CLASSES} max-w-[11rem]`}
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Sort toggle: Newest first / Highest amount */}
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'newest' ? 'highest' : 'newest'))
            }
            aria-label={`Sort order: ${
              sortOrder === 'newest' ? 'Newest first' : 'Highest amount'
            }. Click to toggle.`}
            className={`${CONTROL_CLASSES} inline-flex items-center gap-1.5 hover:bg-slate-700`}
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            {sortOrder === 'newest' ? 'Newest first' : 'Highest amount'}
          </button>

          {/* Export all records as CSV */}
          <button
            type="button"
            onClick={() => exportToCsv(expenses)}
            disabled={expenses.length === 0}
            title="Export all transactions as CSV"
            className={`${CONTROL_CLASSES} inline-flex items-center gap-1.5 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {/* List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="mb-3 h-12 w-12 text-slate-700" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">
            {expenses.length === 0 ? 'No transactions yet' : 'No matches found'}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {expenses.length === 0
              ? 'Add your first expense to get started.'
              : hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Nothing to show here.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800">
          {filteredExpenses.map((expense) => {
            const isIncome = expense.type === 'income';
            const category = CATEGORY_MAP[expense.category];
            const categoryLabel = category?.label ?? expense.category;
            const accent = category?.color ?? (isIncome ? '#34D399' : '#94A3B8');

            return (
              <li
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap"
              >
                {/* Icon + title + date */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accent}1A` }}
                  >
                    <CategoryIcon
                      categoryId={expense.category}
                      className="h-4 w-4"
                      style={{ color: accent }}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {expense.title}
                    </p>
                    <p className="truncate text-xs">
                      <span style={{ color: accent }}>{categoryLabel}</span>
                      <span className="text-slate-500">
                        {' · '}
                        {formatFriendlyDate(expense.date, {
                          locale: settings.locale,
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatSignedCurrency(expense.amount, {
                      type: expense.type,
                      ...currencyOpts,
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(expense)}
                      className={`rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-indigo-400 ${FOCUS_RING_CLASSES}`}
                      aria-label={`Edit ${expense.title}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {confirmDeleteId === expense.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          className={`rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-500 ${FOCUS_RING_CLASSES}`}
                          aria-label={`Confirm deleting ${expense.title}`}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className={`rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600 ${FOCUS_RING_CLASSES}`}
                          aria-label={`Cancel deleting ${expense.title}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(expense.id)}
                        className={`rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-red-400 ${FOCUS_RING_CLASSES}`}
                        aria-label={`Delete ${expense.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
