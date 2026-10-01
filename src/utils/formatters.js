/**
 * Gasto Buster — formatting helpers.
 *
 * Pure functions only (no React, no storage). Every currency/date value that
 * reaches the UI must go through these so formatting stays consistent.
 * Defaults follow the app's Philippine-student audience but every function
 * accepts an override, so switching to USD (or any ISO 4217 code) is a
 * one-line change via settings.
 */

import { DEFAULT_SETTINGS } from '../constants/categories.js';

const { currency: DEFAULT_CURRENCY, locale: DEFAULT_LOCALE } = DEFAULT_SETTINGS;

/** Ensures a value is a finite number; anything else becomes 0. */
function toFiniteNumber(value) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formats a monetary amount, e.g. 1450.5 -> "₱1,450.50" or "$1,450.50".
 *
 * @param {number|string} amount
 * @param {{ currency?: string, locale?: string, showDecimals?: boolean, compact?: boolean }} [options]
 * @returns {string}
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    showDecimals = true,
    compact = false,
  } = options;

  const value = toFiniteNumber(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: compact ? 0 : showDecimals ? 2 : 0,
      maximumFractionDigits: compact ? 1 : showDecimals ? 2 : 0,
      notation: compact ? 'compact' : 'standard',
    }).format(value);
  } catch {
    // Unknown currency/locale pair — fall back to a plain prefixed number.
    return `${currency} ${value.toFixed(showDecimals ? 2 : 0)}`;
  }
}

/**
 * Bare currency symbol for input prefixes and chips: "₱", "$", "€".
 * Falls back to the ISO code when the locale renders no symbol.
 *
 * @param {string} [currency]
 * @param {string} [locale]
 * @returns {string}
 */
export function formatCurrencySymbol(currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE) {
  const formatted = formatCurrency(0, { currency, locale, showDecimals: false });
  const symbol = formatted.replace(/[\d.,\s\u00A0]/g, '');
  return symbol || currency;
}

/**
 * Compact currency for tight spaces (cards, tooltips): 12500 -> "₱12.5K".
 *
 * @param {number|string} amount
 * @param {{ currency?: string, locale?: string }} [options]
 * @returns {string}
 */
export function formatCompactCurrency(amount, options = {}) {
  return formatCurrency(amount, { ...options, compact: true, showDecimals: false });
}

/**
 * Signed amount used in the transaction history: "+ ₱500.00" / "- ₱145.00".
 *
 * @param {number|string} amount
 * @param {{ type?: 'expense'|'income', currency?: string, locale?: string }} [options]
 * @returns {string}
 */
export function formatSignedCurrency(amount, options = {}) {
  const { type = 'expense', ...currencyOptions } = options;
  const prefix = type === 'income' ? '+ ' : '- ';
  return `${prefix}${formatCurrency(Math.abs(toFiniteNumber(amount)), currencyOptions)}`;
}

/**
 * Converts anything date-like (Date, ISO string, epoch ms) into a Date.
 * Returns null for invalid input instead of throwing.
 *
 * `YYYY-MM-DD` strings are treated as local calendar dates (not UTC) so a
 * stored date always renders as the same day in the user's timezone.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {Date|null}
 */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Local-timezone "YYYY-MM-DD" string — the canonical storage format.
 *
 * @param {Date|string|number} [date]
 * @returns {string}
 */
export function toISODate(date = new Date()) {
  const parsed = parseDate(date) ?? new Date();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ISO date for right now (default `date` on new records). */
export function getTodayISO() {
  return toISODate(new Date());
}

/**
 * Date formatting with sensible defaults.
 *
 * @param {Date|string|number|null|undefined} date
 * @param {{ locale?: string, style?: 'short'|'medium'|'long'|'full', timeZone?: string }} [options]
 * @returns {string} Empty string for invalid dates.
 */
export function formatDate(date, options = {}) {
  const { locale = DEFAULT_LOCALE, style = 'medium', timeZone } = options;
  const parsed = parseDate(date);
  if (!parsed) return '';

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: style,
      ...(timeZone ? { timeZone } : {}),
    }).format(parsed);
  } catch {
    return toISODate(parsed);
  }
}

/**
 * Human-friendly day label: "Today", "Yesterday", else a formatted date.
 *
 * @param {Date|string|number|null|undefined} date
 * @param {{ locale?: string, today?: Date|string|number }} [options]
 * @returns {string}
 */
export function formatFriendlyDate(date, options = {}) {
  const { locale = DEFAULT_LOCALE, today = new Date() } = options;
  const parsed = parseDate(date);
  const reference = parseDate(today);
  if (!parsed) return '';
  if (!reference) return formatDate(parsed, { locale, style: 'medium' });

  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (dayStart(parsed) - dayStart(reference)) / 86_400_000
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  return formatDate(parsed, { locale, style: 'medium' });
}

/**
 * Percentage for chart legends and progress bars, e.g. 0.4567 -> "45.7%".
 *
 * @param {number} ratio
 * @param {{ locale?: string, maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatPercent(ratio, options = {}) {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = options;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
  }).format(toFiniteNumber(ratio));
}

/**
 * Period label for the reports navigator:
 *   week  → "Sep 22 – Sep 28, 2025" (en dash; year comes from the end date
 *           so a week spanning New Year labels correctly)
 *   month → "September 2025"
 * Returns '' for a missing/invalid range instead of throwing.
 *
 * @param {{ start: Date|string|number, end: Date|string|number }} range
 * @param {{ type?: 'week'|'month', locale?: string }} [options]
 * @returns {string}
 */
export function formatPeriodLabel(range, options = {}) {
  const { type = 'week', locale = DEFAULT_LOCALE } = options;
  const start = parseDate(range?.start);
  const end = parseDate(range?.end);
  if (!start || !end) return '';

  try {
    if (type === 'month') {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(start);
    }
    const dayFormat = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
    const yearFormat = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    return `${dayFormat.format(start)} – ${dayFormat.format(end)}, ${yearFormat.format(end)}`;
  } catch {
    return toISODate(start);
  }
}
