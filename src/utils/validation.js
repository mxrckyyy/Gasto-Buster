/**
 * Gasto Buster — Zod validation schemas.
 *
 * Every expense that is created, edited, or read back out of storage MUST pass
 * through these schemas (fail-closed on read, so hand-edited LocalStorage can
 * never crash the UI).
 *
 * Schemas are kept compatible with Zod v3 and v4 APIs.
 */

import { z } from 'zod';
import {
  CATEGORY_IDS,
  CURRENCY_OPTIONS,
  DEFAULT_SETTINGS,
  LIMITS,
  TRANSACTION_TYPES,
} from '../constants/categories.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True when the string is a real calendar date in YYYY-MM-DD form. */
function isRealCalendarDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Category id: must exist in constants (derived enum, never hardcoded). */
const categoryIdSchema = z
  .string({ required_error: 'Category is required.' })
  .trim()
  .min(1, 'Category is required.')
  .refine((value) => CATEGORY_IDS.includes(value), {
    message: 'Choose a valid category.',
  });

/** Transaction type: "expense" | "income". */
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES, {
  errorMap: () => ({ message: 'Type must be expense or income.' }),
});

/**
 * Expense schema — the single source of truth for an expense record.
 *
 * Fields: title, amount, category, type, date.
 */
export const expenseSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title is required.')
    .max(LIMITS.titleMaxLength, `Title must be ${LIMITS.titleMaxLength} characters or fewer.`),

  amount: z
    .number({ required_error: 'Amount is required.', invalid_type_error: 'Amount must be a number.' })
    .finite('Amount must be a valid number.')
    .min(LIMITS.amountMin, 'Amount must be greater than 0.')
    .max(LIMITS.amountMax, 'Amount is too large.'),

  category: categoryIdSchema,

  type: transactionTypeSchema,

  date: z
    .string({ required_error: 'Date is required.' })
    .refine(isRealCalendarDate, 'Enter a valid date in YYYY-MM-DD format.'),
});

/** Optional note field — safe to merge once the UI ships a note input. */
export const noteSchema = z
  .string()
  .trim()
  .max(LIMITS.noteMaxLength, `Note must be ${LIMITS.noteMaxLength} characters or fewer.`)
  .optional()
  .default('');

/**
 * Shape used for validating raw form payloads before an id/timestamps exist.
 * Form fields arrive as strings, so `amount` is coerced.
 */
export const expenseFormSchema = expenseSchema.extend({
  amount: z
    .coerce.number({ invalid_type_error: 'Amount must be a number.' })
    .finite('Amount must be a valid number.')
    .min(LIMITS.amountMin, 'Amount must be greater than 0.')
    .max(LIMITS.amountMax, 'Amount is too large.'),
  note: noteSchema,
});

/**
 * Shape used when re-validating records loaded from storage
 * (record envelope: id + timestamps + expense fields).
 */
export const expenseRecordSchema = expenseSchema.extend({
  id: z.string().min(1, 'Record id is missing.'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  note: noteSchema,
});

/**
 * Settings schema — currency, locale, daily allowance cap, month start day.
 * Applied on every settings write and on every read back from storage.
 */
export const settingsSchema = z.object({
  currency: z
    .string()
    .refine(
      (code) => CURRENCY_OPTIONS.some((option) => option.code === code),
      'Unsupported currency.'
    ),
  locale: z
    .string({ required_error: 'Locale is required.' })
    .min(2, 'Locale is required.')
    .max(35, 'Locale is too long.'),
  dailyAllowance: z
    .coerce.number({ invalid_type_error: 'Enter a valid amount.' })
    .finite('Enter a valid amount.')
    .min(0, 'Daily allowance cannot be negative.')
    .max(LIMITS.amountMax, 'Daily allowance is too large.'),
  monthStartDay: z
    .coerce.number({ invalid_type_error: 'Invalid month start day.' })
    .int('Invalid month start day.')
    .min(1, 'Month start day must be between 1 and 31.')
    .max(31, 'Month start day must be between 1 and 31.'),
});

/** Runs a single field through its schema, falling back on failure. */
function parseField(schema, value, fallback) {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

/**
 * Re-validates raw settings from storage (fail-closed). Corrupted fields
 * fall back to their defaults individually instead of nuking the rest.
 *
 * @param {unknown} raw - Raw value read from localStorage.
 * @returns {object} A fully valid settings object.
 */
export function sanitizeStoredSettings(raw) {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const shape = settingsSchema.shape;

  return {
    currency: parseField(shape.currency, source.currency, DEFAULT_SETTINGS.currency),
    locale: parseField(shape.locale, source.locale, DEFAULT_SETTINGS.locale),
    dailyAllowance: parseField(
      shape.dailyAllowance,
      source.dailyAllowance,
      DEFAULT_SETTINGS.dailyAllowance
    ),
    monthStartDay: parseField(
      shape.monthStartDay,
      source.monthStartDay,
      DEFAULT_SETTINGS.monthStartDay
    ),
  };
}

/**
 * Validates an expense form payload.
 *
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, errors?: Record<string, string> }}
 */
export function validateExpense(data) {
  const result = expenseFormSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: formatZodErrors(result.error) };
}

/**
 * Validates a stored expense record (used on every storage read).
 *
 * @param {unknown} data
 * @returns {{ success: boolean, data?: object, errors?: Record<string, string> }}
 */
export function validateExpenseRecord(data) {
  const result = expenseRecordSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: formatZodErrors(result.error) };
}

/**
 * Flattens a ZodError into `{ field: firstErrorMessage }` for inline
 * form validation.
 *
 * @param {z.ZodError} error
 * @returns {Record<string, string>}
 */
export function formatZodErrors(error) {
  return error.issues.reduce((accumulator, issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : '_';
    if (!accumulator[field]) accumulator[field] = issue.message;
    return accumulator;
  }, {});
}

/**
 * Keeps only known category ids — filters malformed records during storage reads
 * instead of silently dropping whole entries.
 *
 * @param {unknown} records
 * @returns {object[]} Valid expense records only.
 */
export function sanitizeStoredExpenses(records) {
  if (!Array.isArray(records)) return [];
  return records
    .map((record) => validateExpenseRecord(record))
    .filter((result) => result.success)
    .map((result) => result.data);
}
