/**
 * Gasto Buster — CSV export (pure serialization + offline download).
 *
 * `toCSV` / `buildFilename` are pure and unit-tested; `downloadFile` is
 * the side-effecting wrapper that triggers a browser download using
 * Blob + URL.createObjectURL — no network calls, no external libs, so it
 * works fully offline.
 *
 * CSV contract:
 *   - header row first, columns exactly:
 *     Date,Category,Description,Amount,Currency,Week,Month
 *   - Amount is a bare 2-decimal number (no symbol, no thousands
 *     separator) so spreadsheets read it as a number and can SUM it
 *   - fields containing a comma, double quote, or newline are wrapped
 *     in double quotes; internal quotes are doubled (" → "")
 *   - CRLF line endings for Excel compatibility
 *   - no BOM: the header row stays byte-exact to the contract
 */

import { toISODate } from '../utils/formatters.js';
import { toISOWeek } from './periods.js';

/** Which slice of data the export covers (drives the filename). */
// 'period' | 'all'

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Exact column order required by the export contract. */
const CSV_HEADER = [
  'Date',
  'Category',
  'Description',
  'Amount',
  'Currency',
  'Week',
  'Month',
];

/** Quotes a cell only when it contains a comma, quote, or newline. */
function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Local calendar Date from a zero-padded YYYY-MM-DD string. */
function localDate(date) {
  const match = ISO_DATE_RE.exec(date ?? '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Serializes records to CSV text (header row + one row per record, in
 * the order given). An empty list yields a valid header-only file.
 * Never throws.
 *
 * @param {object[]} expenses Expense/income records (schema-validated upstream).
 * @param {{ categories: object, currency?: string }} options
 *   `categories` — category lookup (id → { label, … }) so ids never reach
 *   the file; `currency` — ISO 4217 code written to the Currency column
 *   (defaults to 'PHP', the app default).
 * @returns {string}
 */
export function toCSV(expenses, { categories, currency = 'PHP' } = {}) {
  const list = Array.isArray(expenses) ? expenses : [];
  const labels = categories ?? {};

  const rows = list.map((expense) => {
    const date = expense?.date ?? '';
    const parsed = localDate(date);
    const week = parsed ? toISOWeek(parsed) : '';
    const month = parsed ? date.slice(0, 7) : '';

    return [
      date,
      labels[expense?.category]?.label ?? expense?.category ?? '',
      expense?.title ?? '',
      Number(expense?.amount).toFixed(2),
      currency,
      week,
      month,
    ]
      .map(escapeCell)
      .join(',');
  });

  return [[...CSV_HEADER].join(','), ...rows].join('\r\n');
}

/**
 * Download filename:
 *   period → gasto-buster_2025-09-22_2025-09-28.csv
 *   all    → gasto-buster_all_2025-09-30.csv (trailing date = `now`)
 *
 * Missing bounds fall back to today's date — the filename is always
 * well-formed and never throws.
 *
 * @param {'period' | 'all'} scope
 * @param {{ start: Date, end: Date }} [range]
 * @param {Date} [now]
 * @returns {string}
 */
export function buildFilename(scope, range, now = new Date()) {
  const today = toISODate(now);
  if (scope === 'all') return `gasto-buster_all_${today}.csv`;
  const start = range?.start ? toISODate(range.start) : today;
  const end = range?.end ? toISODate(range.end) : today;
  return `gasto-buster_${start}_${end}.csv`;
}

/**
 * Triggers a client-side download via a temporary <a download> and
 * revokes the object URL once the click has fired. Fully offline.
 *
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 * @returns {void}
 */
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
