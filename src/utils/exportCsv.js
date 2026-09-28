/**
 * Gasto Buster — CSV export utility.
 *
 * Turns expense/income records into a spreadsheet-friendly CSV and triggers
 * a browser download as `gasto-buster-export.csv`.
 *
 * `buildCsv()` is pure (trivially unit-testable); `exportToCsv()` is the
 * side-effecting wrapper that performs the download. A UTF-8 BOM is prepended
 * so currency symbols (₱, €, ¥) render correctly in Excel.
 */

import {
  CATEGORY_MAP,
  TRANSACTION_TYPE_LABELS,
} from '../constants/categories.js';

/** Human-readable column headers. */
const CSV_HEADERS = ['Date', 'Type', 'Category', 'Title', 'Amount', 'Note'];

/** Download filename used by exportToCsv(). */
export const CSV_FILENAME = 'gasto-buster-export.csv';

/** Quotes a cell when it contains commas, quotes, or line breaks. */
function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Newest-first ordering: by date, then by createdAt. */
function byNewestFirst(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (b.createdAt || '').localeCompare(a.createdAt || '');
}

/**
 * Builds the CSV representation of expense records.
 *
 * @param {object[]} expenses - Valid expense/income records.
 * @returns {string} CSV text (header row + one row per record).
 */
export function buildCsv(expenses) {
  const records = Array.isArray(expenses) ? [...expenses].sort(byNewestFirst) : [];

  const rows = records.map((expense) =>
    [
      expense.date,
      TRANSACTION_TYPE_LABELS[expense.type] ?? expense.type,
      CATEGORY_MAP[expense.category]?.label ?? expense.category,
      expense.title,
      Number(expense.amount).toFixed(2),
      expense.note ?? '',
    ]
      .map(escapeCell)
      .join(',')
  );

  return [[...CSV_HEADERS].join(','), ...rows].join('\r\n');
}

/**
 * Downloads the given records as a CSV file.
 *
 * @param {object[]} expenses - Valid expense/income records.
 */
export function exportToCsv(expenses) {
  const csv = buildCsv(expenses);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = CSV_FILENAME;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
