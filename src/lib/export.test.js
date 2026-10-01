/**
 * Gasto Buster — CSV export tests.
 *
 * Locks the export contract: exact 7-column header, RFC-style escaping
 * (comma / quote / newline, doubled quotes), CRLF line endings, category
 * labels instead of ids, bare 2-decimal amounts, ISO week + YYYY-MM month
 * columns, filename patterns, and the offline download wrapper.
 */

import { describe, expect, it, vi } from 'vitest';
import { toCSV, buildFilename, downloadFile } from './export.js';

const CATEGORIES = {
  food: { id: 'food', label: 'Food & Drinks' },
  transport: { id: 'transport', label: 'Transportation' },
};

const HEADER = 'Date,Category,Description,Amount,Currency,Week,Month';

const row = (overrides = {}) => ({
  date: '2025-09-24',
  category: 'food',
  title: 'Campus lunch',
  amount: 145.5,
  type: 'expense',
  ...overrides,
});

describe('toCSV — header', () => {
  it('writes the exact header row, first and byte-exact (no BOM)', () => {
    const csv = toCSV([row()], { categories: CATEGORIES });
    expect(csv.split('\r\n')[0]).toBe(HEADER);
    expect(csv.startsWith('Date,')).toBe(true);
  });

  it('returns a header-only CSV for an empty list', () => {
    const csv = toCSV([], { categories: CATEGORIES });
    expect(csv).toBe(HEADER);
    expect(csv).not.toContain('\r\n');
  });

  it('never throws for a missing array', () => {
    expect(toCSV(undefined, { categories: {} })).toBe(HEADER);
  });
});

describe('toCSV — rows', () => {
  it('writes date, category label, description, amount, currency, ISO week, month', () => {
    const csv = toCSV([row()], { categories: CATEGORIES });
    expect(csv.split('\r\n')[1]).toBe(
      '2025-09-24,Food & Drinks,Campus lunch,145.50,PHP,2025-W39,2025-09'
    );
  });

  it('uses the human category label, never the id', () => {
    const csv = toCSV([row({ category: 'transport' })], { categories: CATEGORIES });
    expect(csv).toContain(',Transportation,');
    expect(csv).not.toContain(',transport,');
  });

  it('falls back to the raw id when no label exists', () => {
    const csv = toCSV([row({ category: 'mystery' })], { categories: CATEGORIES });
    expect(csv).toContain(',mystery,');
  });

  it('formats the amount with 2 decimals, no symbol and no separators', () => {
    const csv = toCSV([row({ amount: 1234567.891 })], { categories: CATEGORIES });
    expect(csv).toContain(',1234567.89,');
    expect(csv).not.toContain('1,234,567');
    expect(csv).not.toContain('₱');
  });

  it('writes an empty description when title is missing', () => {
    const csv = toCSV([row({ title: undefined })], { categories: CATEGORIES });
    expect(csv.split('\r\n')[1]).toBe(
      '2025-09-24,Food & Drinks,,145.50,PHP,2025-W39,2025-09'
    );
  });

  it('honours an explicit currency code (default is PHP)', () => {
    const php = toCSV([row()], { categories: CATEGORIES });
    const usd = toCSV([row()], { categories: CATEGORIES, currency: 'USD' });
    expect(php).toContain(',PHP,');
    expect(usd).toContain(',USD,');
  });

  it('keeps rows in input order', () => {
    const csv = toCSV(
      [row({ title: 'first' }), row({ title: 'second' })],
      { categories: CATEGORIES }
    );
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain(',first,');
    expect(lines[2]).toContain(',second,');
  });
});

describe('toCSV — escaping', () => {
  it('quotes fields containing commas', () => {
    const csv = toCSV([row({ title: 'Lunch, snacks, coffee' })], { categories: CATEGORIES });
    // The whole description stays one quoted cell despite its commas.
    expect(csv.split('\r\n')[1]).toBe(
      '2025-09-24,Food & Drinks,"Lunch, snacks, coffee",145.50,PHP,2025-W39,2025-09'
    );
  });

  it('quotes fields containing newlines', () => {
    const csv = toCSV([row({ title: 'line one\nline two' })], { categories: CATEGORIES });
    expect(csv).toContain('"line one\nline two"');
  });

  it('quotes fields containing double quotes and doubles internal quotes', () => {
    const csv = toCSV([row({ title: 'He said "hi"' })], { categories: CATEGORIES });
    expect(csv).toContain('"He said ""hi"""');
    expect(csv).not.toContain('He said "hi"');
  });

  it('does not quote plain fields', () => {
    const csv = toCSV([row()], { categories: CATEGORIES });
    expect(csv.split('\r\n')[1]).toBe(
      '2025-09-24,Food & Drinks,Campus lunch,145.50,PHP,2025-W39,2025-09'
    );
  });
});

describe('toCSV — line endings', () => {
  it('separates every line with \\r\\n and never a bare \\n', () => {
    const csv = toCSV([row(), row({ title: 'second' })], { categories: CATEGORIES });
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    // A lone \n (not preceded by \r) must not exist.
    expect(csv.replace(/\r\n/g, '')).not.toContain('\n');
    expect(csv.replace(/\r\n/g, '')).not.toContain('\r');
  });
});

describe('buildFilename', () => {
  const start = new Date(2025, 8, 22);
  const end = new Date(2025, 8, 28);

  it('builds a period filename from the range bounds', () => {
    expect(buildFilename('period', { start, end })).toBe(
      'gasto-buster_2025-09-22_2025-09-28.csv'
    );
  });

  it('builds an all-data filename stamped with today', () => {
    expect(buildFilename('all', undefined, new Date(2025, 8, 30))).toBe(
      'gasto-buster_all_2025-09-30.csv'
    );
  });

  it('falls back to today for a missing range instead of throwing', () => {
    expect(buildFilename('period', undefined, new Date(2025, 8, 30))).toBe(
      'gasto-buster_2025-09-30_2025-09-30.csv'
    );
  });
});

describe('downloadFile', () => {
  it('creates an object URL, clicks a temporary link, then revokes it', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createSpy = vi.fn(() => 'blob:gb-test');
    const revokeSpy = vi.fn();
    URL.createObjectURL = createSpy;
    URL.revokeObjectURL = revokeSpy;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      downloadFile('gasto-buster_test.csv', HEADER, 'text/csv;charset=utf-8');

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalledWith('blob:gb-test');
      // The temporary <a> must not linger in the document.
      expect(document.querySelector('a[download]')).toBeNull();
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
