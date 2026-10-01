/**
 * Gasto Buster — period math tests.
 *
 * Locks the calendar rules the period view depends on: Mon–Sun weeks
 * (local time), calendar months incl. Feb edge cases, period navigation,
 * inclusive range filtering, totals/grouping, delta semantics, and
 * ISO 8601 week labels.
 */

import { describe, expect, it } from 'vitest';
import {
  getWeekRange,
  getMonthRange,
  getPreviousPeriod,
  getNextPeriod,
  filterExpensesByRange,
  sumExpenses,
  groupByCategory,
  computeDelta,
  toISOWeek,
} from './periods.js';

/** Build a LOCAL date from parts (avoids UTC parsing surprises). */
const localDate = (year, month, day) => new Date(year, month - 1, day);

const iso = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

describe('getWeekRange', () => {
  it('returns Monday–Sunday for a mid-week date', () => {
    const range = getWeekRange(localDate(2025, 9, 24)); // Wednesday
    expect(iso(range.start)).toBe('2025-09-22'); // Monday
    expect(iso(range.end)).toBe('2025-09-28'); // Sunday
  });

  it('places a Sunday in the week that started the previous Monday', () => {
    const range = getWeekRange(localDate(2025, 9, 28)); // Sunday
    expect(iso(range.start)).toBe('2025-09-22');
    expect(iso(range.end)).toBe('2025-09-28');
  });

  it('places a Monday at the start of its own week', () => {
    const range = getWeekRange(localDate(2025, 9, 22));
    expect(iso(range.start)).toBe('2025-09-22');
    expect(iso(range.end)).toBe('2025-09-28');
  });

  it('spans the year boundary when the week crosses it', () => {
    const range = getWeekRange(localDate(2025, 1, 1)); // Wednesday
    expect(iso(range.start)).toBe('2024-12-30');
    expect(iso(range.end)).toBe('2025-01-05');
  });
});

describe('getMonthRange', () => {
  it('handles February in a leap year (2024 → 29 days)', () => {
    const range = getMonthRange(localDate(2024, 2, 10));
    expect(iso(range.start)).toBe('2024-02-01');
    expect(iso(range.end)).toBe('2024-02-29');
  });

  it('handles February in a non-leap year (2025 → 28 days)', () => {
    const range = getMonthRange(localDate(2025, 2, 10));
    expect(iso(range.start)).toBe('2025-02-01');
    expect(iso(range.end)).toBe('2025-02-28');
  });

  it('handles 30-day months', () => {
    const range = getMonthRange(localDate(2025, 4, 15));
    expect(iso(range.start)).toBe('2025-04-01');
    expect(iso(range.end)).toBe('2025-04-30');
  });

  it('handles 31-day months', () => {
    const range = getMonthRange(localDate(2025, 1, 31));
    expect(iso(range.start)).toBe('2025-01-01');
    expect(iso(range.end)).toBe('2025-01-31');
  });
});

describe('getPreviousPeriod / getNextPeriod', () => {
  it('shifts a week back and forward by exactly 7 days', () => {
    const week = getWeekRange(localDate(2025, 9, 24));
    const prev = getPreviousPeriod(week, 'week');
    expect(iso(prev.start)).toBe('2025-09-15');
    expect(iso(prev.end)).toBe('2025-09-21');

    const next = getNextPeriod(week, 'week');
    expect(iso(next.start)).toBe('2025-09-29');
    expect(iso(next.end)).toBe('2025-10-05');
  });

  it('moves a month to the previous calendar month', () => {
    const month = getMonthRange(localDate(2025, 9, 10));
    const prev = getPreviousPeriod(month, 'month');
    expect(iso(prev.start)).toBe('2025-08-01');
    expect(iso(prev.end)).toBe('2025-08-31');
  });

  it('moves a month to the next calendar month, crossing years', () => {
    const month = getMonthRange(localDate(2025, 12, 10));
    const next = getNextPeriod(month, 'month');
    expect(iso(next.start)).toBe('2026-01-01');
    expect(iso(next.end)).toBe('2026-01-31');
  });

  it('navigates January back into the previous year', () => {
    const month = getMonthRange(localDate(2025, 1, 10));
    const prev = getPreviousPeriod(month, 'month');
    expect(iso(prev.start)).toBe('2024-12-01');
    expect(iso(prev.end)).toBe('2024-12-31');
  });

  it('round-trips: prev → next returns the original week', () => {
    const week = getWeekRange(localDate(2025, 9, 24));
    const roundTrip = getNextPeriod(getPreviousPeriod(week, 'week'), 'week');
    expect(iso(roundTrip.start)).toBe(iso(week.start));
    expect(iso(roundTrip.end)).toBe(iso(week.end));
  });
});

describe('filterExpensesByRange', () => {
  const range = getWeekRange(localDate(2025, 9, 24)); // Sep 22 – Sep 28
  const expenses = [
    { id: 'a', date: '2025-09-21', amount: 10 },
    { id: 'b', date: '2025-09-22', amount: 20 },
    { id: 'c', date: '2025-09-25', amount: 30 },
    { id: 'd', date: '2025-09-28', amount: 40 },
    { id: 'e', date: '2025-09-29', amount: 50 },
  ];

  it('is inclusive on both boundaries', () => {
    const result = filterExpensesByRange(expenses, range);
    expect(result.map((expense) => expense.id)).toEqual(['b', 'c', 'd']);
  });

  it('returns a new array and leaves the input untouched', () => {
    const result = filterExpensesByRange(expenses, range);
    expect(result).not.toBe(expenses);
    expect(expenses).toHaveLength(5);
  });

  it('returns [] for an empty list', () => {
    expect(filterExpensesByRange([], range)).toEqual([]);
  });

  it('returns [] for a missing/invalid range instead of throwing', () => {
    expect(filterExpensesByRange(expenses, null)).toEqual([]);
    expect(
      filterExpensesByRange(expenses, { start: new Date('nope'), end: new Date() })
    ).toEqual([]);
  });
});

describe('sumExpenses', () => {
  it('returns 0 for an empty array', () => {
    expect(sumExpenses([])).toBe(0);
  });

  it('sums amounts, ignoring non-finite values', () => {
    expect(sumExpenses([{ amount: 100.5 }, { amount: 'not-a-number' }, { amount: 0.25 }])).toBe(
      100.75
    );
  });
});

describe('groupByCategory', () => {
  it('returns {} for an empty array', () => {
    expect(groupByCategory([])).toEqual({});
  });

  it('accumulates total and count per category id', () => {
    const groups = groupByCategory([
      { category: 'food', amount: 100 },
      { category: 'food', amount: 50 },
      { category: 'transport', amount: 30 },
    ]);
    expect(groups.food).toEqual({ total: 150, count: 2 });
    expect(groups.transport).toEqual({ total: 30, count: 1 });
  });
});

describe('computeDelta', () => {
  it('returns percent null (no baseline) when previous is 0', () => {
    expect(computeDelta(100, 0)).toEqual({ absolute: 100, percent: null });
    expect(computeDelta(0, 0)).toEqual({ absolute: 0, percent: null });
  });

  it('returns percent 0 when there is no change', () => {
    expect(computeDelta(100, 100)).toEqual({ absolute: 0, percent: 0 });
  });

  it('returns a signed ratio for growth and decline', () => {
    expect(computeDelta(113, 100)).toEqual({ absolute: 13, percent: 0.13 });
    expect(computeDelta(90, 100)).toEqual({ absolute: -10, percent: -0.1 });
  });
});

describe('toISOWeek', () => {
  it('returns 2025-W01 for 2025-01-01 (Wednesday of ISO week 1)', () => {
    expect(toISOWeek(localDate(2025, 1, 1))).toBe('2025-W01');
  });

  it('returns 2025-W01 for 2024-12-30 (Monday of ISO week 1 of the next year)', () => {
    expect(toISOWeek(localDate(2024, 12, 30))).toBe('2025-W01');
  });

  it('returns the same label across every day of one ISO week', () => {
    expect(toISOWeek(localDate(2025, 9, 22))).toBe('2025-W39'); // Mon
    expect(toISOWeek(localDate(2025, 9, 25))).toBe('2025-W39'); // Thu
    expect(toISOWeek(localDate(2025, 9, 28))).toBe('2025-W39'); // Sun
  });

  it('labels 2020-12-28 as week 53 (leap-year ISO year)', () => {
    expect(toISOWeek(localDate(2020, 12, 28))).toBe('2020-W53');
  });

  it("pads the week number (2025's first week)", () => {
    expect(toISOWeek(localDate(2025, 1, 6))).toBe('2025-W02');
  });

  it('returns "" for invalid input instead of throwing', () => {
    expect(toISOWeek('not-a-date')).toBe('');
  });
});
