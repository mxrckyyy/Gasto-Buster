/**
 * Gasto Buster — TransactionList component.
 *
 * Filterable, sortable transaction history: search by title, filter by
 * category, toggle sort order (newest first / highest amount), and delete
 * with an inline confirmation step. Full-bleed card; rows use a
 * minmax(0, 1fr) grid so the title column expands with the viewport
 * instead of clustering at the left edge.
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
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Button from '../ui/Button.jsx';
import Input, { FIELD_CLASSES } from '../ui/Input.jsx';
import { cn } from '../../utils/cn.js';

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
    <Card as="section" pad={5}>
      <div className="mb-[var(--space-4)] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Transaction History
          </h3>
          <Chip>
            {filteredExpenses.length} of {expenses.length}
          </Chip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search by title */}
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search title..."
              aria-label="Search transactions by title"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 sm:w-48"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
            className={cn(FIELD_CLASSES, 'max-w-[11rem]')}
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Sort toggle: Newest first / Highest amount */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setSortOrder((prev) => (prev === 'newest' ? 'highest' : 'newest'))
            }
            aria-label={`Sort order: ${
              sortOrder === 'newest' ? 'Newest first' : 'Highest amount'
            }. Click to toggle.`}
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            {sortOrder === 'newest' ? 'Newest first' : 'Highest amount'}
          </Button>

          {/* Export all records as CSV */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCsv(expenses)}
            disabled={expenses.length === 0}
            title="Export all transactions as CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[var(--space-6)] text-center">
          <Receipt
            className="mb-3 h-12 w-12 text-gray-700"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-gray-300">
            {expenses.length === 0 ? 'No transactions yet' : 'No matches found'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {expenses.length === 0
              ? 'Add your first expense to get started.'
              : hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Nothing to show here.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-onyx-line">
          {filteredExpenses.map((expense) => {
            const isIncome = expense.type === 'income';
            const category = CATEGORY_MAP[expense.category];
            const categoryLabel = category?.label ?? expense.category;
            const accent =
              category?.color ?? (isIncome ? 'var(--success)' : 'var(--gray-500)');

            return (
              <li
                key={expense.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--space-3)] py-[var(--space-3)]"
              >
                {/* Icon + title + date (minmax(0,1fr): expands with viewport) */}
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-onyx-soft">
                    <CategoryIcon
                      categoryId={expense.category}
                      className="h-4 w-4"
                      style={{ color: accent }}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-100">
                      {expense.title}
                    </p>
                    <p className="truncate text-xs">
                      <span style={{ color: accent }}>{categoryLabel}</span>
                      <span className="text-gray-500">
                        {' · '}
                        {formatFriendlyDate(expense.date, {
                          locale: settings.locale,
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isIncome ? 'text-success' : 'text-danger'
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
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-onyx-soft hover:text-accent ${FOCUS_RING_CLASSES}`}
                      aria-label={`Edit ${expense.title}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {confirmDeleteId === expense.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="danger-solid"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          aria-label={`Confirm deleting ${expense.title}`}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label={`Cancel deleting ${expense.title}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(expense.id)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-onyx-soft hover:text-danger ${FOCUS_RING_CLASSES}`}
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
    </Card>
  );
}
