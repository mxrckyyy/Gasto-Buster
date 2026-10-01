/**
 * Gasto Buster — formatter unit tests.
 *
 * Pure-function coverage for the currency/date helpers that every value
 * passes through before reaching the UI.
 */

import { describe, expect, it } from 'vitest';
import {
  formatCompactCurrency,
  formatCurrency,
  formatCurrencySymbol,
  formatDate,
  formatFriendlyDate,
  formatPercent,
  formatPeriodLabel,
  formatSignedCurrency,
  getTodayISO,
  parseDate,
  toISODate,
} from './formatters.js';

describe('formatCurrency', () => {
  it('formats PHP amounts with the en-PH defaults', () => {
    expect(formatCurrency(1450.5)).toBe('₱1,450.50');
    expect(formatCurrency(0)).toBe('₱0.00');
    expect(formatCurrency('299')).toBe('₱299.00');
  });

  it('formats USD amounts when currency + locale are overridden', () => {
    expect(formatCurrency(1450.5, { currency: 'USD', locale: 'en-US' })).toBe('$1,450.50');
    expect(formatCurrency(-25, { currency: 'USD', locale: 'en-US' })).toBe('-$25.00');
  });

  it('drops decimals when showDecimals is false', () => {
    expect(formatCurrency(1450.4, { showDecimals: false })).toBe('₱1,450');
  });

  it('normalizes non-finite input to zero instead of throwing', () => {
    expect(formatCurrency(Number.NaN)).toBe('₱0.00');
    expect(formatCurrency(undefined)).toBe('₱0.00');
    expect(formatCurrency('not-a-number')).toBe('₱0.00');
  });

  it('falls back to a plain prefixed value for an unsupported currency', () => {
    expect(formatCurrency(10, { currency: 'NOPE' })).toBe('NOPE 10.00');
  });
});

describe('formatCurrencySymbol', () => {
  it('returns the bare symbol for PHP and USD', () => {
    expect(formatCurrencySymbol('PHP', 'en-PH')).toBe('₱');
    expect(formatCurrencySymbol('USD', 'en-US')).toBe('$');
    expect(formatCurrencySymbol('JPY', 'ja-JP')).toMatch(/[¥￥]/);
  });

  it('falls back to the ISO code when no symbol renders', () => {
    expect(formatCurrencySymbol('XYZ', 'en-US')).toBe('XYZ');
  });
});

describe('formatCompactCurrency / formatSignedCurrency', () => {
  it('compacts large amounts for tight spaces', () => {
    expect(formatCompactCurrency(12500)).toBe('₱12.5K');
    expect(formatCompactCurrency(12500, { currency: 'USD', locale: 'en-US' })).toBe('$12.5K');
  });

  it('prefixes the sign by transaction type', () => {
    const opts = { currency: 'PHP', locale: 'en-PH' };
    expect(formatSignedCurrency(500, { type: 'income', ...opts })).toBe('+ ₱500.00');
    expect(formatSignedCurrency(145, { type: 'expense', ...opts })).toBe('- ₱145.00');
  });
});

describe('parseDate / toISODate / getTodayISO', () => {
  it('treats YYYY-MM-DD strings as local calendar dates', () => {
    const parsed = parseDate('2026-09-27');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(27);
  });

  it('returns null for invalid or empty input', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate('27-09-2026')).toBeNull();
  });

  it('passes Date instances and epoch values through', () => {
    const date = new Date(2026, 8, 27);
    expect(parseDate(date)).toBe(date);
    const epoch = Date.UTC(2026, 8, 27);
    expect(parseDate(epoch).getTime()).toBe(epoch);
  });

  it('renders the canonical zero-padded YYYY-MM-DD storage format', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate('2026-09-27')).toBe('2026-09-27');
    expect(toISODate('September 27, 2026')).toBe('2026-09-27');
  });

  it('produces a today value matching the storage pattern', () => {
    expect(getTodayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getTodayISO()).toBe(toISODate(new Date()));
  });
});

describe('formatDate / formatFriendlyDate / formatPercent', () => {
  it('formats a medium date for the default locale', () => {
    expect(formatDate('2026-09-27')).toBe('Sep 27, 2026');
    expect(formatDate('2026-09-27', { style: 'short' })).toBe('9/27/26');
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });

  it('labels relative days against the supplied reference day', () => {
    const today = '2026-09-27';
    expect(formatFriendlyDate(today, { today })).toBe('Today');
    expect(formatFriendlyDate('2026-09-26', { today })).toBe('Yesterday');
    expect(formatFriendlyDate('2026-09-28', { today })).toBe('Tomorrow');
    expect(formatFriendlyDate('2026-09-20', { today })).toBe('Sep 20, 2026');
  });

  it('formats ratios as percentages', () => {
    expect(formatPercent(0.4567)).toBe('45.7%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(Number.NaN)).toBe('0%');
  });
});

describe('formatPeriodLabel', () => {
  it('formats a week range as "Sep 22 – Sep 28, 2025"', () => {
    expect(
      formatPeriodLabel({ start: new Date(2025, 8, 22), end: new Date(2025, 8, 28) })
    ).toBe('Sep 22 – Sep 28, 2025');
  });

  it('labels a week spanning New Year with the end date year', () => {
    expect(
      formatPeriodLabel({ start: new Date(2024, 11, 30), end: new Date(2025, 0, 5) })
    ).toBe('Dec 30 – Jan 5, 2025');
  });

  it('formats a month range as "September 2025"', () => {
    expect(
      formatPeriodLabel(
        { start: new Date(2025, 8, 1), end: new Date(2025, 8, 30) },
        { type: 'month' }
      )
    ).toBe('September 2025');
  });

  it('returns "" for a missing or invalid range instead of throwing', () => {
    expect(formatPeriodLabel(null)).toBe('');
    expect(formatPeriodLabel(undefined)).toBe('');
    expect(formatPeriodLabel({ start: 'nope', end: new Date() })).toBe('');
  });
});
