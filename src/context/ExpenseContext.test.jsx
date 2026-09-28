/**
 * Gasto Buster — ExpenseContext tests.
 *
 * Exercises the CRUD state transitions the whole app depends on:
 * add, update, delete, settings/clear, derived metrics, and the
 * daily-cap (dailyAllowance) limit alerts.
 */

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExpenseProvider } from './ExpenseContext.jsx';
import useExpenseContext from '../hooks/useExpenseContext.js';
import { getTodayISO } from '../utils/formatters.js';
import { STORAGE_KEYS } from '../constants/categories.js';

/** Latest context value, refreshed on every provider render. */
let latest = null;

function Probe() {
  latest = useExpenseContext();
  return (
    <div>
      <span data-testid="count">{latest.expenses.length}</span>
      <span data-testid="today-spent">{latest.todaySpent}</span>
      <span data-testid="total-expense">{latest.totalExpense}</span>
      <span data-testid="total-income">{latest.totalIncome}</span>
      <span data-testid="net-balance">{latest.netBalance}</span>
      <span data-testid="over-limit">{String(latest.isOverDailyLimit)}</span>
      <span data-testid="daily-allowance">{latest.settings.dailyAllowance}</span>
      <span data-testid="loaded">{String(!latest.isLoading)}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <ExpenseProvider>
      <Probe />
    </ExpenseProvider>
  );
}

const read = (id) => screen.getByTestId(id).textContent;

const EXPENSE = {
  title: 'Campus cafeteria lunch',
  amount: 145.5,
  category: 'food',
  type: 'expense',
  date: getTodayISO(),
  note: '',
};

const INCOME = {
  title: 'Weekly allowance',
  amount: 500,
  category: 'allowance',
  type: 'income',
  date: getTodayISO(),
  note: '',
};

describe('ExpenseProvider — initial load', () => {
  it('starts empty, finishes loading, and persists to localStorage', () => {
    renderProvider();

    expect(read('count')).toBe('0');
    expect(read('loaded')).toBe('true');
    expect(read('total-expense')).toBe('0');
    expect(read('over-limit')).toBe('false');
    expect(localStorage.getItem(STORAGE_KEYS.expenses)).toBeNull();
  });

  it('hydrates previously stored records on mount', () => {
    localStorage.setItem(
      STORAGE_KEYS.expenses,
      JSON.stringify([
        {
          id: 'exp_stored_1',
          title: 'Stored snack',
          amount: 60,
          category: 'food',
          type: 'expense',
          date: getTodayISO(),
          note: '',
          createdAt: '2026-09-27T08:00:00.000Z',
        },
      ])
    );

    renderProvider();

    expect(read('count')).toBe('1');
    expect(read('total-expense')).toBe('60');
  });
});

describe('ExpenseProvider — addExpense', () => {
  it('adds a validated record, attaches an id/timestamp, and derives metrics', () => {
    renderProvider();

    let result;
    act(() => {
      result = latest.addExpense({ ...EXPENSE, amount: '145.5' });
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBeTruthy();
    expect(result.data.createdAt).toBeTruthy();
    expect(result.data.amount).toBe(145.5);

    expect(read('count')).toBe('1');
    expect(read('total-expense')).toBe('145.5');
    expect(read('today-spent')).toBe('145.5');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Campus cafeteria lunch');
  });

  it('rejects an invalid record without mutating state or storage', () => {
    renderProvider();

    let result;
    act(() => {
      result = latest.addExpense({ ...EXPENSE, amount: -5 });
    });

    expect(result.success).toBe(false);
    expect(result.errors.amount).toBe('Amount must be greater than 0.');
    expect(read('count')).toBe('0');
    expect(localStorage.getItem(STORAGE_KEYS.expenses)).toBeNull();
  });

  it('keeps income separate from expenses in the derived totals', () => {
    renderProvider();

    act(() => {
      latest.addExpense(EXPENSE);
    });
    act(() => {
      latest.addExpense(INCOME);
    });

    expect(read('count')).toBe('2');
    expect(read('total-expense')).toBe('145.5');
    expect(read('total-income')).toBe('500');
    expect(read('net-balance')).toBe('354.5');
  });
});

describe('ExpenseProvider — updateExpense', () => {
  it('updates an existing record in place', () => {
    renderProvider();

    let added;
    act(() => {
      added = latest.addExpense(EXPENSE);
    });

    let updated;
    act(() => {
      updated = latest.updateExpense(added.data.id, {
        title: 'Campus cafeteria dinner',
        amount: 180,
      });
    });

    expect(updated.success).toBe(true);
    expect(updated.data.title).toBe('Campus cafeteria dinner');
    expect(updated.data.amount).toBe(180);
    expect(updated.data.updatedAt).toBeTruthy();
    expect(read('count')).toBe('1');
    expect(read('total-expense')).toBe('180');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses));
    expect(stored[0].title).toBe('Campus cafeteria dinner');
  });

  it('refuses to update an unknown id', () => {
    renderProvider();

    let result;
    act(() => {
      result = latest.updateExpense('exp_missing', { title: 'Ghost' });
    });

    expect(result.success).toBe(false);
    expect(result.errors.id).toBe('Expense not found.');
    expect(read('count')).toBe('0');
  });

  it('refuses an invalid update payload', () => {
    renderProvider();

    let added;
    act(() => {
      added = latest.addExpense(EXPENSE);
    });

    let result;
    act(() => {
      result = latest.updateExpense(added.data.id, { date: '2026-02-30' });
    });

    expect(result.success).toBe(false);
    expect(result.errors.date).toBe('Enter a valid date in YYYY-MM-DD format.');
    expect(read('count')).toBe('1');
  });
});

describe('ExpenseProvider — deleteExpense', () => {
  it('removes a record and recalculates metrics', () => {
    renderProvider();

    let added;
    act(() => {
      added = latest.addExpense(EXPENSE);
    });
    act(() => {
      latest.addExpense(INCOME);
    });
    expect(read('count')).toBe('2');

    let removed;
    act(() => {
      removed = latest.deleteExpense(added.data.id);
    });

    expect(removed).toBe(true);
    expect(read('count')).toBe('1');
    expect(read('total-expense')).toBe('0');
    expect(read('total-income')).toBe('500');
    expect(read('net-balance')).toBe('500');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).not.toBe(added.data.id);
  });

  it('returns false for an unknown id', () => {
    renderProvider();

    let removed;
    act(() => {
      removed = latest.deleteExpense('exp_missing');
    });

    expect(removed).toBe(false);
    expect(read('count')).toBe('0');
  });
});

describe('ExpenseProvider — daily cap alerts', () => {
  it('flags the cap as exceeded once today\'s spend passes it', () => {
    renderProvider();

    act(() => {
      latest.updateSettings({ dailyAllowance: 300 });
    });
    expect(read('daily-allowance')).toBe('300');
    expect(read('over-limit')).toBe('false');

    act(() => {
      latest.addExpense({ ...EXPENSE, amount: 250 });
    });
    expect(read('today-spent')).toBe('250');
    expect(read('over-limit')).toBe('false');

    act(() => {
      latest.addExpense({ ...EXPENSE, title: 'Printout credits', amount: 60 });
    });
    expect(read('today-spent')).toBe('310');
    expect(read('over-limit')).toBe('true');
  });

  it('never reports a breach when no cap is configured (0 = unlimited)', () => {
    renderProvider();

    act(() => {
      latest.addExpense({ ...EXPENSE, amount: 5000 });
    });

    expect(read('daily-allowance')).toBe('0');
    expect(read('today-spent')).toBe('5000');
    expect(read('over-limit')).toBe('false');
  });

  it('ignores transactions from other days when computing today\'s spend', () => {
    renderProvider();

    act(() => {
      latest.updateSettings({ dailyAllowance: 100 });
      latest.addExpense({ ...EXPENSE, amount: 500, date: '2026-09-26' });
    });

    expect(read('today-spent')).toBe('0');
    expect(read('total-expense')).toBe('500');
    expect(read('over-limit')).toBe('false');
  });

  it('releases the alert once the day\'s expenses are deleted', () => {
    renderProvider();

    let added;
    act(() => {
      latest.updateSettings({ dailyAllowance: 200 });
      added = latest.addExpense({ ...EXPENSE, amount: 400 });
    });
    expect(read('over-limit')).toBe('true');

    act(() => {
      latest.deleteExpense(added.data.id);
    });

    expect(read('today-spent')).toBe('0');
    expect(read('over-limit')).toBe('false');
  });
});

describe('ExpenseProvider — updateSettings / clearAllData', () => {
  it('persists settings changes', () => {
    renderProvider();

    act(() => {
      latest.updateSettings({ currency: 'USD', locale: 'en-US', dailyAllowance: 250 });
    });

    expect(read('daily-allowance')).toBe('250');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
    expect(stored.currency).toBe('USD');
    expect(stored.dailyAllowance).toBe(250);
  });

  it('wipes transactions and restores default settings', () => {
    renderProvider();

    act(() => {
      latest.addExpense(EXPENSE);
      latest.updateSettings({ dailyAllowance: 250 });
    });
    expect(read('count')).toBe('1');

    act(() => {
      latest.clearAllData();
    });

    expect(read('count')).toBe('0');
    expect(read('total-expense')).toBe('0');
    expect(read('daily-allowance')).toBe('0');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses))).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)).currency).toBe('PHP');
  });
});
