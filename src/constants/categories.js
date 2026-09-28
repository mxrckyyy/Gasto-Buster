/**
 * Gasto Buster — static application constants.
 *
 * Categories are the single source of truth for grouping, chart colors,
 * icon names and form select options. `src/utils/validation.js` derives its
 * enum from CATEGORY_IDS, so adding a category here automatically makes it
 * valid in the expense schema.
 *
 * `icon` is a Lucide React component name, resolved by the <CategoryIcon />
 * component in Phase 2 (components/common/CategoryIcon.jsx).
 */

/** Primary expense categories for students. */
export const CATEGORIES = [
  {
    id: 'food',
    label: 'Food',
    icon: 'UtensilsCrossed',
    color: '#F97316',
    chipClass: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: 'Bus',
    color: '#3B82F6',
    chipClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'school-supplies',
    label: 'School Supplies',
    icon: 'GraduationCap',
    color: '#8B5CF6',
    chipClass: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: 'Repeat',
    color: '#EC4899',
    chipClass: 'bg-pink-100 text-pink-700',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'Gamepad2',
    color: '#EF4444',
    chipClass: 'bg-red-100 text-red-700',
  },
  {
    id: 'health',
    label: 'Health',
    icon: 'HeartPulse',
    color: '#14B8A6',
    chipClass: 'bg-teal-100 text-teal-700',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    color: '#F59E0B',
    chipClass: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'others',
    label: 'Others',
    icon: 'Package',
    color: '#64748B',
    chipClass: 'bg-slate-100 text-slate-700',
  },
];

/** Categories available when a record's type is "income". */
export const INCOME_CATEGORIES = [
  {
    id: 'allowance',
    label: 'Allowance',
    icon: 'HandCoins',
    color: '#22C55E',
    chipClass: 'bg-green-100 text-green-700',
  },
  {
    id: 'part-time-job',
    label: 'Part-time Job',
    icon: 'Briefcase',
    color: '#0EA5E9',
    chipClass: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'scholarship',
    label: 'Scholarship',
    icon: 'Award',
    color: '#6366F1',
    chipClass: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'gift',
    label: 'Gift',
    icon: 'Gift',
    color: '#A855F7',
    chipClass: 'bg-purple-100 text-purple-700',
  },
];

/** Every valid category id (expense + income). Used by the Zod schema. */
export const ALL_CATEGORIES = [...CATEGORIES, ...INCOME_CATEGORIES];

/** @type {string[]} */
export const CATEGORY_IDS = ALL_CATEGORIES.map((category) => category.id);

/** @type {Record<string, object>} Fast lookup map by id. */
export const CATEGORY_MAP = ALL_CATEGORIES.reduce((map, category) => {
  map[category.id] = category;
  return map;
}, {});

/** Transaction types supported by the tracker. */
export const TRANSACTION_TYPES = ['expense', 'income'];

/** Human labels for transaction types. */
export const TRANSACTION_TYPE_LABELS = {
  expense: 'Expense',
  income: 'Income',
};

/** Storage keys — namespaced to avoid clashing with other apps on the domain. */
export const STORAGE_KEYS = {
  expenses: 'gasto-buster:expenses',
  settings: 'gasto-buster:settings',
};

/** Defaults applied when no settings have been saved yet. */
export const DEFAULT_SETTINGS = {
  currency: 'PHP',
  locale: 'en-PH',
  dailyAllowance: 0,
  monthStartDay: 1,
};

/** Supported display currencies (ISO 4217 codes). */
export const CURRENCY_OPTIONS = [
  { code: 'PHP', label: 'Philippine Peso (₱)', locale: 'en-PH' },
  { code: 'USD', label: 'US Dollar ($)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)', locale: 'de-DE' },
  { code: 'JPY', label: 'Japanese Yen (¥)', locale: 'ja-JP' },
];

/** Allowance alert thresholds as fractions of the daily cap. */
export const ALLOWANCE_THRESHOLDS = {
  warning: 0.8,
  exceeded: 1,
};

/** App-wide limits enforced by both the schema and the UI. */
export const LIMITS = {
  titleMaxLength: 80,
  noteMaxLength: 200,
  amountMin: 0.01,
  amountMax: 1_000_000_000,
};
