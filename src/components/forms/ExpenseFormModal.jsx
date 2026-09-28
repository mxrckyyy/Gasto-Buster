/**
 * Gasto Buster — ExpenseFormModal component.
 *
 * Responsive modal for adding and editing expenses/income entries.
 * Uses react-hook-form with the Zod schema from src/utils/validation.js
 * (via @hookform/resolvers). Submits through the ExpenseContext CRUD
 * actions and surfaces field-level validation errors inline.
 */

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, ChevronDown, AlertCircle } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { expenseFormSchema } from '../../utils/validation.js';
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import {
  getTodayISO,
  formatCurrencySymbol,
} from '../../utils/formatters.js';
import { getCategoryIcon } from '../common/CategoryIcon.jsx';

const VALIDATED_FIELDS = ['title', 'amount', 'category', 'type', 'date', 'note'];

const INPUT_CLASSES = `w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 ${FOCUS_RING_CLASSES}`;

const LABEL_CLASSES =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400';

/** Inline validation message wired to its field with aria-describedby. */
function FieldError({ id, message }) {
  return (
    <p id={id} className="mt-1 text-xs text-red-400" role="alert">
      {message}
    </p>
  );
}

/**
 * Icon dropdown for category selection (native <select> cannot render icons).
 *
 * @param {{
 *   id: string,
 *   value: string,
 *   options: { id: string, label: string, color: string }[],
 *   onChange: (categoryId: string) => void,
 *   invalid?: boolean,
 * }} props
 */
export function CategorySelect({ id, value, options, onChange, invalid = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const toggleRef = useRef(null);

  const selected = options.find((option) => option.id === value) ?? options[0];
  const SelectedIcon = getCategoryIcon(selected.id);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Capture phase so Escape closes the listbox first; stopPropagation keeps
    // the surrounding dialog open until the listbox itself is dismissed.
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      event.stopPropagation();
      toggleRef.current?.focus();
    };
    // Tabbing out of the dropdown dismisses it instead of leaving it dangling.
    const handleFocusIn = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen]);

  const selectOption = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={invalid || undefined}
        className={`${INPUT_CLASSES} flex items-center justify-between gap-2 text-left ${
          invalid ? 'border-red-500' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon
            className="h-4 w-4 shrink-0"
            style={{ color: selected.color }}
          />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Category"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-2xl"
        >
          {options.map((option) => {
            const OptionIcon = getCategoryIcon(option.id);
            const isSelected = option.id === selected.id;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-700 ${FOCUS_RING_CLASSES} ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  <OptionIcon
                    className="h-4 w-4 shrink-0"
                    style={{ color: option.color }}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   editExpense?: object | null,
 * }} props
 */
export default function ExpenseFormModal({ isOpen, onClose, editExpense = null }) {
  const { addExpense, updateExpense, settings } = useExpenseContext();

  // Keyboard focus: primary field on open, Tab cycling, restore on close.
  const dialogRef = useRef(null);
  useFocusTrap({ containerRef: dialogRef, isOpen });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: '',
      amount: '',
      type: 'expense',
      category: 'food',
      date: getTodayISO(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const categoryOptions =
    selectedType === 'income' ? INCOME_CATEGORIES : CATEGORIES;
  const currencySymbol = formatCurrencySymbol(settings.currency, settings.locale);

  // Populate the form when opening (add defaults vs. edit existing record).
  useEffect(() => {
    if (!isOpen) return;

    if (editExpense) {
      reset({
        title: editExpense.title,
        amount: String(editExpense.amount),
        type: editExpense.type,
        category: editExpense.category,
        date: editExpense.date,
        note: editExpense.note || '',
      });
    } else {
      reset({
        title: '',
        amount: '',
        type: 'expense',
        category: 'food',
        date: getTodayISO(),
        note: '',
      });
    }
  }, [editExpense, reset, isOpen]);

  // Lock body scroll and close on Escape while the modal is open.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Switching type keeps entered values; category only resets when invalid.
  const handleTypeChange = (nextType) => {
    if (nextType === selectedType) return;
    setValue('type', nextType, { shouldDirty: true, shouldValidate: true });

    const nextOptions = nextType === 'income' ? INCOME_CATEGORIES : CATEGORIES;
    const currentCategory = getValues('category');
    if (!nextOptions.some((option) => option.id === currentCategory)) {
      setValue('category', nextOptions[0].id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const onSubmit = (values) => {
    const payload = {
      ...values,
      amount: Number(values.amount),
      note: values.note || '',
    };

    const result = editExpense
      ? updateExpense(editExpense.id, payload)
      : addExpense(payload);

    if (result.success) {
      onClose();
      return;
    }

    // Map context-level Zod errors back onto the matching form fields.
    const fieldErrors = result.errors || {};
    let mappedAny = false;
    Object.entries(fieldErrors).forEach(([field, message]) => {
      if (VALIDATED_FIELDS.includes(field)) {
        setError(field, { type: 'server', message });
        mappedAny = true;
      }
    });
    if (!mappedAny) {
      setError('root.serverError', {
        type: 'server',
        message: 'Could not save this transaction. Please try again.',
      });
    }
  };

  if (!isOpen) return null;

  const rootError = errors.root?.serverError;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={editExpense ? 'Edit transaction' : 'Add transaction'}
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editExpense ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="text-xs text-slate-500">
              {editExpense
                ? 'Update the details below.'
                : 'Log an expense or income entry.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white ${FOCUS_RING_CLASSES}`}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {rootError && (
            <p className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {rootError.message}
            </p>
          )}

          {/* Type Toggle */}
          <div>
            <span id="expense-type-label" className={LABEL_CLASSES}>
              Type
            </span>
            <div
              role="group"
              aria-labelledby="expense-type-label"
              className="flex gap-2"
            >
              {TRANSACTION_TYPES.map((type) => {
                const isActive = selectedType === type;
                const activeClass =
                  type === 'income'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500 bg-rose-500/10 text-rose-400';
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    aria-pressed={isActive}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${FOCUS_RING_CLASSES} ${
                      isActive
                        ? activeClass
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {TRANSACTION_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="expense-title" className={LABEL_CLASSES}>
              Title
            </label>
            <input
              id="expense-title"
              type="text"
              maxLength={80}
              autoComplete="off"
              placeholder="e.g. Campus cafeteria lunch"
              data-autofocus
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? 'expense-title-error' : undefined}
              className={`${INPUT_CLASSES} ${errors.title ? 'border-red-500' : ''}`}
              {...register('title')}
            />
            {errors.title && (
              <FieldError id="expense-title-error" message={errors.title.message} />
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="expense-amount" className={LABEL_CLASSES}>
              Amount
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                aria-hidden="true"
              >
                {currencySymbol}
              </span>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={errors.amount ? true : undefined}
                aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
                className={`${INPUT_CLASSES} pl-9 ${errors.amount ? 'border-red-500' : ''}`}
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <FieldError id="expense-amount-error" message={errors.amount.message} />
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="expense-category" className={LABEL_CLASSES}>
              Category
            </label>
            <CategorySelect
              id="expense-category"
              value={watch('category')}
              options={categoryOptions}
              onChange={(categoryId) =>
                setValue('category', categoryId, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              invalid={Boolean(errors.category)}
            />
            {errors.category && (
              <FieldError id="expense-category-error" message={errors.category.message} />
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="expense-date" className={LABEL_CLASSES}>
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={errors.date ? 'expense-date-error' : undefined}
              className={`${INPUT_CLASSES} ${errors.date ? 'border-red-500' : ''}`}
              {...register('date')}
            />
            {errors.date && (
              <FieldError id="expense-date-error" message={errors.date.message} />
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label htmlFor="expense-note" className={LABEL_CLASSES}>
              Note <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="expense-note"
              rows={2}
              maxLength={200}
              placeholder="Add a note..."
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? 'expense-note-error' : undefined}
              className={`${INPUT_CLASSES} resize-none ${errors.note ? 'border-red-500' : ''}`}
              {...register('note')}
            />
            {errors.note && (
              <FieldError id="expense-note-error" message={errors.note.message} />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 ${FOCUS_RING_CLASSES}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 ${FOCUS_RING_CLASSES}`}
            >
              {editExpense ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
