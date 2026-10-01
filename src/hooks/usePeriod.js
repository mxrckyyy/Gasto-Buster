/**
 * Gasto Buster — usePeriod hook.
 *
 * Holds the active reporting period — `{ type: 'week' | 'month',
 * anchorDate }` — plus everything derived from it: the calendar range,
 * the previous equivalent period, the filtered records, totals, delta,
 * and per-category totals for the chart.
 *
 * Persists to localStorage['gb.period'] (JSON via useLocalStorage, the
 * only hook allowed to touch storage), mirroring the existing `gb.sidebar`
 * UI-state pattern. A missing or corrupt value fails closed to
 * week-of-today, so the view always renders a sane period.
 *
 * Switching type KEEPS the anchor date (Sep 24 as week → Sep 24 as month).
 * goPrev/goNext/toToday move the anchor; ranges are computed fresh via
 * useMemo from { type, anchorDate }.
 */

import { useMemo } from 'react';
import useLocalStorage from './useLocalStorage.js';
import useExpenseContext from './useExpenseContext.js';
import { getTodayISO, parseDate, toISODate } from '../utils/formatters.js';
import {
  getWeekRange,
  getMonthRange,
  getPreviousPeriod,
  getNextPeriod,
  filterExpensesByRange,
  sumExpenses,
  groupByCategory,
  computeDelta,
} from '../lib/periods.js';

const PERIOD_STORAGE_KEY = 'gb.period';

/** Stable fallback (anchor stays null → resolved to "today" at read time). */
const DEFAULT_PERIOD = { type: 'week', anchorDate: null };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Expense records only — totals/chart/delta never mix income in. */
const onlyExpenses = (records) => records.filter((record) => record.type === 'expense');

export default function usePeriod() {
  const { expenses, settings } = useExpenseContext();
  const [stored, setStored] = useLocalStorage(PERIOD_STORAGE_KEY, DEFAULT_PERIOD);

  // Fail closed: anything but an explicit persisted pair falls back to
  // week-of-today (never crashes on hand-edited storage).
  const safe = stored && typeof stored === 'object' ? stored : DEFAULT_PERIOD;
  const type = safe.type === 'month' ? 'month' : 'week';
  const anchorDateISO =
    typeof safe.anchorDate === 'string' && ISO_DATE_RE.test(safe.anchorDate)
      ? safe.anchorDate
      : getTodayISO();

  const anchorDate = useMemo(() => parseDate(anchorDateISO) ?? new Date(), [anchorDateISO]);

  const range = useMemo(
    () => (type === 'month' ? getMonthRange(anchorDate) : getWeekRange(anchorDate)),
    [type, anchorDate]
  );

  const previousRange = useMemo(() => getPreviousPeriod(range, type), [range, type]);

  const filteredExpenses = useMemo(
    () => filterExpensesByRange(expenses, range),
    [expenses, range]
  );
  const previousExpenses = useMemo(
    () => filterExpensesByRange(expenses, previousRange),
    [expenses, previousRange]
  );

  /** Total spent (expenses only) inside the active period. */
  const spent = useMemo(
    () => sumExpenses(onlyExpenses(filteredExpenses)),
    [filteredExpenses]
  );

  /** Total spent inside the previous equivalent period. */
  const previousSpent = useMemo(
    () => sumExpenses(onlyExpenses(previousExpenses)),
    [previousExpenses]
  );

  /** { absolute, percent } vs the previous period (percent null when no baseline). */
  const delta = useMemo(() => computeDelta(spent, previousSpent), [spent, previousSpent]);

  /** Record shape the chart expects: { [categoryId]: amount }. */
  const categoryTotals = useMemo(() => {
    const grouped = groupByCategory(onlyExpenses(filteredExpenses));
    return Object.fromEntries(
      Object.entries(grouped).map(([categoryId, group]) => [categoryId, group.total])
    );
  }, [filteredExpenses]);

  const setType = (nextType) =>
    setStored({ type: nextType === 'month' ? 'month' : 'week', anchorDate: anchorDateISO });

  const goPrev = () => setStored({ type, anchorDate: toISODate(previousRange.start) });

  const goNext = () => {
    const next = getNextPeriod(range, type);
    setStored({ type, anchorDate: toISODate(next.start) });
  };

  const goToToday = () => setStored({ type, anchorDate: getTodayISO() });

  return {
    // State
    type,
    anchorDate,
    anchorDateISO,
    // Derivations
    range,
    previousRange,
    filteredExpenses,
    spent,
    previousSpent,
    delta,
    categoryTotals,
    // Actions
    setType,
    goPrev,
    goNext,
    goToToday,
    // Formatting inputs
    currency: settings.currency,
    locale: settings.locale,
  };
}
