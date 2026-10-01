/**
 * Gasto Buster — period math (pure JavaScript, no React, no storage).
 *
 * Calendar weeks run Monday–Sunday and calendar months run 1st–last, always
 * in the LOCAL timezone (a stored `YYYY-MM-DD` is a local calendar date).
 * ISO 8601 week labels ("2025-W39") follow the standard rule: week 1 is the
 * week containing the first Thursday of the year.
 *
 * Every function is total: empty arrays and degenerate inputs yield sane
 * defaults (0, {}, []) instead of throwing.
 *
 * @typedef {{ start: Date, end: Date }} DateRange
 * @typedef {'week' | 'month'} PeriodType
 */

import { parseDate, toISODate } from '../utils/formatters.js';

/** True for a real (non-Invalid) Date. */
function isFiniteDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

/** Normalizes any accepted input to a Date; bad input → Invalid Date (never throws). */
function toDate(value) {
  if (value instanceof Date) return value;
  return parseDate(value) ?? new Date(NaN);
}

/** Local midnight of the same day (DST-safe day arithmetic starts here). */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Date shifted by whole local days ( setDate handles month/year rollover). */
function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Monday–Sunday range containing `date` (local time).
 * A Sunday belongs to the week that started the PREVIOUS Monday.
 *
 * @param {Date|string|number} date
 * @returns {DateRange}
 */
export function getWeekRange(date) {
  const day = startOfDay(toDate(date));
  const dow = (day.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  const start = addDays(day, -dow);
  return { start, end: addDays(start, 6) };
}

/**
 * 1st–last day range of `date`'s calendar month (local time).
 *
 * @param {Date|string|number} date
 * @returns {DateRange}
 */
export function getMonthRange(date) {
  const day = startOfDay(toDate(date));
  const start = new Date(day.getFullYear(), day.getMonth(), 1);
  const end = new Date(day.getFullYear(), day.getMonth() + 1, 0);
  return { start, end };
}

/**
 * The period immediately before `range` for the given type.
 *
 * @param {DateRange} range
 * @param {PeriodType} type
 * @returns {DateRange}
 */
export function getPreviousPeriod(range, type) {
  if (type === 'month') {
    const start = new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1);
    const end = new Date(range.start.getFullYear(), range.start.getMonth(), 0);
    return { start, end };
  }
  return { start: addDays(range.start, -7), end: addDays(range.end, -7) };
}

/**
 * The period immediately after `range` for the given type.
 *
 * @param {DateRange} range
 * @param {PeriodType} type
 * @returns {DateRange}
 */
export function getNextPeriod(range, type) {
  if (type === 'month') {
    const start = new Date(range.end.getFullYear(), range.end.getMonth() + 1, 1);
    const end = new Date(range.end.getFullYear(), range.end.getMonth() + 2, 0);
    return { start, end };
  }
  return { start: addDays(range.start, 7), end: addDays(range.end, 7) };
}

/**
 * Records whose `date` falls inside `range`, INCLUSIVE on both boundaries.
 * Compares canonical `YYYY-MM-DD` strings (safe lexicographic order).
 *
 * @param {object[]} expenses
 * @param {DateRange} range
 * @returns {object[]}
 */
export function filterExpensesByRange(expenses, range) {
  if (!Array.isArray(expenses) || !range || !isFiniteDate(range.start) || !isFiniteDate(range.end)) {
    return [];
  }
  const start = toISODate(range.start);
  const end = toISODate(range.end);

  return expenses.filter(
    (expense) =>
      typeof expense?.date === 'string' &&
      expense.date.length === 10 &&
      expense.date >= start &&
      expense.date <= end
  );
}

/**
 * Sum of `amount` values; non-finite amounts count as 0. Empty → 0.
 *
 * @param {object[]} expenses
 * @returns {number}
 */
export function sumExpenses(expenses) {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((total, expense) => {
    const amount = Number(expense?.amount);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

/**
 * Groups records by category id.
 *
 * @param {object[]} expenses
 * @returns {{ [categoryId: string]: { total: number, count: number } }}
 */
export function groupByCategory(expenses) {
  const groups = {};
  if (!Array.isArray(expenses)) return groups;

  for (const expense of expenses) {
    const key = expense?.category;
    if (!key) continue;
    const amount = Number(expense.amount);
    const group = groups[key] ?? (groups[key] = { total: 0, count: 0 });
    group.total += Number.isFinite(amount) ? amount : 0;
    group.count += 1;
  }
  return groups;
}

/**
 * Period-over-period delta.
 *
 * When `previous` is 0 there is no baseline, so `percent` is null
 * (render "—") while `absolute` still reports the current value.
 * Identical values produce `{ absolute: 0, percent: 0 }`.
 *
 * @param {number} current
 * @param {number} previous
 * @returns {{ absolute: number, percent: number | null }}
 */
export function computeDelta(current, previous) {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safePrevious = Number.isFinite(previous) ? previous : 0;
  const absolute = safeCurrent - safePrevious;
  if (safePrevious === 0) return { absolute: safeCurrent, percent: null };
  return { absolute, percent: absolute / safePrevious };
}

/**
 * ISO 8601 week label, e.g. "2025-W39". Week 1 contains the first
 * Thursday of its ISO year (so 2024-12-30 is already 2025-W01).
 *
 * @param {Date|string|number} date
 * @returns {string} `YYYY-Www`, or '' for invalid input.
 */
export function toISOWeek(date) {
  const day = startOfDay(toDate(date));
  if (!isFiniteDate(day)) return '';

  // Step to the Thursday of this ISO week (local time).
  const dow = (day.getDay() + 6) % 7;
  const thursday = addDays(day, 3 - dow);
  const isoYear = thursday.getFullYear();

  // Thursday of the week containing Jan 1 determines week 1.
  const jan1 = new Date(isoYear, 0, 1);
  const jan1Dow = (jan1.getDay() + 6) % 7;
  const firstThursday = addDays(jan1, 3 - jan1Dow);

  const DAY = 24 * 60 * 60 * 1000;
  const week = 1 + Math.round((thursday - firstThursday) / (7 * DAY));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}
