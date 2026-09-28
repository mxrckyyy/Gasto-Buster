/**
 * Gasto Buster — validation unit tests.
 *
 * Covers the Zod guard that every expense write passes through:
 * coercion, title trimming, amount sign/finite rules, and strict
 * YYYY-MM-DD calendar-date rejection.
 */

import { describe, expect, it } from 'vitest';
import {
  expenseFormSchema,
  expenseSchema,
  formatZodErrors,
  sanitizeStoredExpenses,
  validateExpense,
} from './validation.js';

const VALID_FORM_PAYLOAD = {
  title: 'Campus cafeteria lunch',
  amount: '145.5',
  category: 'food',
  type: 'expense',
  date: '2026-09-27',
  note: '',
};

const VALID_RECORD = {
  id: 'exp_test_1',
  title: 'Campus cafeteria lunch',
  amount: 145.5,
  category: 'food',
  type: 'expense',
  date: '2026-09-27',
  note: '',
  createdAt: '2026-09-27T08:00:00.000Z',
};

describe('expenseSchema', () => {
  it('accepts a fully valid record unchanged', () => {
    const result = expenseSchema.safeParse(VALID_RECORD);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      title: 'Campus cafeteria lunch',
      amount: 145.5,
      category: 'food',
      type: 'expense',
      date: '2026-09-27',
    });
  });

  it('trims surrounding whitespace from the title', () => {
    const result = expenseSchema.safeParse({
      ...VALID_RECORD,
      title: '   Campus cafeteria lunch   ',
    });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Campus cafeteria lunch');
  });

  it('rejects a title that is empty after trimming', () => {
    const result = expenseSchema.safeParse({ ...VALID_RECORD, title: '     ' });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).title).toBe('Title is required.');
  });

  it('rejects a title longer than the 80 character cap', () => {
    const result = expenseSchema.safeParse({
      ...VALID_RECORD,
      title: 'x'.repeat(81),
    });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).title).toMatch(/80 characters or fewer/);
  });

  it('rejects negative and zero amounts', () => {
    const negative = expenseSchema.safeParse({ ...VALID_RECORD, amount: -10 });
    expect(negative.success).toBe(false);
    expect(formatZodErrors(negative.error).amount).toBe('Amount must be greater than 0.');

    const zero = expenseSchema.safeParse({ ...VALID_RECORD, amount: 0 });
    expect(zero.success).toBe(false);
    expect(formatZodErrors(zero.error).amount).toBe('Amount must be greater than 0.');
  });

  it('rejects non-finite amounts', () => {
    const result = expenseSchema.safeParse({ ...VALID_RECORD, amount: Number.POSITIVE_INFINITY });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).amount).toBe('Amount must be a valid number.');
  });

  it.each([
    ['2026-02-30', 'non-existent day'],
    ['2026-02-29', 'non-leap-year Feb 29'],
    ['2026-13-01', 'month out of range'],
    ['2026-00-10', 'month zero'],
    ['2026-9-05', 'unpadded month'],
    ['09-27-2026', 'US-style order'],
    ['27/09/2026', 'slash separated'],
    ['not-a-date', 'free text'],
    ['', 'empty string'],
  ])('rejects the malformed date %s (%s)', (date) => {
    const result = expenseSchema.safeParse({ ...VALID_RECORD, date });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).date).toBe(
      'Enter a valid date in YYYY-MM-DD format.'
    );
  });

  it('accepts real calendar dates, including leap days', () => {
    expect(expenseSchema.safeParse({ ...VALID_RECORD, date: '2024-02-29' }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...VALID_RECORD, date: '2026-12-31' }).success).toBe(true);
  });

  it('rejects unknown categories and transaction types', () => {
    const category = expenseSchema.safeParse({ ...VALID_RECORD, category: 'time-travel' });
    expect(category.success).toBe(false);
    expect(formatZodErrors(category.error).category).toBe('Choose a valid category.');

    const type = expenseSchema.safeParse({ ...VALID_RECORD, type: 'refund' });
    expect(type.success).toBe(false);
    expect(formatZodErrors(type.error).type).toBe('Type must be expense or income.');
  });
});

describe('expenseFormSchema (raw form payloads)', () => {
  it('coerces a string amount into a number', () => {
    const result = expenseFormSchema.safeParse(VALID_FORM_PAYLOAD);
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(145.5);
    expect(typeof result.data.amount).toBe('number');
  });

  it('trims the title on raw form input', () => {
    const result = expenseFormSchema.safeParse({
      ...VALID_FORM_PAYLOAD,
      title: '  Bus fare  ',
    });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Bus fare');
  });

  it('rejects a negative string amount', () => {
    const result = expenseFormSchema.safeParse({ ...VALID_FORM_PAYLOAD, amount: '-250' });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).amount).toBe('Amount must be greater than 0.');
  });

  it('rejects a non-numeric amount', () => {
    const result = expenseFormSchema.safeParse({ ...VALID_FORM_PAYLOAD, amount: 'abc' });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).amount).toMatch(/number/i);
  });

  it('rejects a bad date on raw form input', () => {
    const result = expenseFormSchema.safeParse({ ...VALID_FORM_PAYLOAD, date: '2026-02-30' });
    expect(result.success).toBe(false);
    expect(formatZodErrors(result.error).date).toBe(
      'Enter a valid date in YYYY-MM-DD format.'
    );
  });
});

describe('validateExpense', () => {
  it('returns a success payload for valid input', () => {
    const result = validateExpense(VALID_FORM_PAYLOAD);
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(145.5);
    expect(result.errors).toBeUndefined();
  });

  it('returns field-keyed errors for invalid input', () => {
    const result = validateExpense({ ...VALID_FORM_PAYLOAD, title: '', amount: '-1' });
    expect(result.success).toBe(false);
    expect(result.errors).toEqual({
      title: 'Title is required.',
      amount: 'Amount must be greater than 0.',
    });
  });

  it('reports a single field error when only one field is invalid', () => {
    const result = validateExpense({ ...VALID_FORM_PAYLOAD, date: 'nope' });
    expect(result.success).toBe(false);
    expect(Object.keys(result.errors)).toEqual(['date']);
  });
});

describe('sanitizeStoredExpenses', () => {
  it('keeps valid records and drops corrupted ones', () => {
    const sanitized = sanitizeStoredExpenses([
      VALID_RECORD,
      { ...VALID_RECORD, id: 'exp_bad', amount: -5 },
      { ...VALID_RECORD, id: 'exp_bad_2', date: '2026-02-30' },
      'not-an-object',
      null,
    ]);

    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].id).toBe('exp_test_1');
  });

  it('returns an empty array for non-array input (fail-closed)', () => {
    expect(sanitizeStoredExpenses(null)).toEqual([]);
    expect(sanitizeStoredExpenses({})).toEqual([]);
    expect(sanitizeStoredExpenses('[]')).toEqual([]);
  });
});
