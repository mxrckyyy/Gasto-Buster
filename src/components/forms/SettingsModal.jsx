/**
 * Gasto Buster — SettingsModal component.
 *
 * Configure the daily allowance cap and preferred currency, and manage
 * stored data (double-confirmed wipe). Every save passes through
 * `settingsSchema` (Zod) and syncs via ExpenseContext's `updateSettings`,
 * so changes appear instantly across the header, banner, and cards.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Wallet, Coins, Database, AlertTriangle } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { settingsSchema, formatZodErrors } from '../../utils/validation.js';
import { CURRENCY_OPTIONS } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import { formatCurrency, formatCurrencySymbol } from '../../utils/formatters.js';

const INPUT_CLASSES = `w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 ${FOCUS_RING_CLASSES}`;

const LABEL_CLASSES =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400';

/** Section heading with an icon. */
function SectionHeading({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 * }} props
 */
export default function SettingsModal({ isOpen, onClose }) {
  const { settings, expenses, updateSettings, clearAllData } =
    useExpenseContext();

  // Keyboard focus: allowance input on open, Tab cycling, restore on close.
  const dialogRef = useRef(null);
  useFocusTrap({ containerRef: dialogRef, isOpen });

  const [allowanceDraft, setAllowanceDraft] = useState('');
  const [currencyCode, setCurrencyCode] = useState('PHP');
  const [allowanceError, setAllowanceError] = useState(null);
  const [confirmArmed, setConfirmArmed] = useState(false);

  const selectedOption =
    CURRENCY_OPTIONS.find((option) => option.code === currencyCode) ??
    CURRENCY_OPTIONS[0];

  // Keep the latest onClose in a ref so parent re-renders never re-run the
  // draft-sync effect (which would wipe in-progress edits).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Sync drafts from stored settings when the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setAllowanceDraft(String(Number(settings.dailyAllowance) || 0));
    setCurrencyCode(settings.currency);
    setAllowanceError(null);
    setConfirmArmed(false);
  }, [isOpen, settings.dailyAllowance, settings.currency]);

  // Lock body scroll and close on Escape while open.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = allowanceDraft.trim();
    if (trimmed === '') {
      setAllowanceError('Enter a daily allowance amount (0 disables the cap).');
      return;
    }

    const result = settingsSchema.safeParse({
      ...settings,
      dailyAllowance: Number(trimmed),
      currency: selectedOption.code,
      locale: selectedOption.locale,
    });

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      setAllowanceError(errors.dailyAllowance ?? errors.currency ?? null);
      return;
    }

    updateSettings(result.data);
    onClose();
  };

  // Double confirmation: arm first, execute on the second press.
  const handleClearData = () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    clearAllData();
    onClose();
  };

  // Enter inside any field saves — the dialog is a real <form> so keyboard
  // users never need to reach for the mouse (WCAG 2.1.1 Keyboard).
  const handleFormSubmit = (event) => {
    event.preventDefault();
    handleSave();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <p className="text-xs text-slate-500">
              Stored locally in your browser only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white ${FOCUS_RING_CLASSES}`}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} noValidate>
          <div className="space-y-6">
            {/* Daily allowance cap */}
            <section className="space-y-3">
              <SectionHeading
                icon={Wallet}
                title="Daily Allowance Cap"
                hint="How much you aim to spend per day."
              />
              <div>
                <label htmlFor="settings-allowance" className={LABEL_CLASSES}>
                  Cap per day
                </label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                    aria-hidden="true"
                  >
                    {formatCurrencySymbol(selectedOption.code, selectedOption.locale)}
                  </span>
                  <input
                    id="settings-allowance"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={allowanceDraft}
                    data-autofocus
                    onChange={(event) => {
                      setAllowanceDraft(event.target.value);
                      setAllowanceError(null);
                    }}
                    placeholder="300"
                    aria-invalid={allowanceError ? true : undefined}
                    aria-describedby={
                      allowanceError
                        ? 'settings-allowance-error'
                        : 'settings-allowance-hint'
                    }
                    className={`${INPUT_CLASSES} pl-9 ${
                      allowanceError ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {allowanceError ? (
                  <p
                    id="settings-allowance-error"
                    className="mt-1 text-xs text-red-400"
                    role="alert"
                  >
                    {allowanceError}
                  </p>
                ) : (
                  <p id="settings-allowance-hint" className="mt-1 text-xs text-slate-500">
                    Set 0 to disable the daily cap.
                  </p>
                )}
              </div>
            </section>

            {/* Currency */}
            <section className="space-y-3">
              <SectionHeading
                icon={Coins}
                title="Preferred Currency"
                hint="Used for every amount in the app."
              />
              <div>
                <label htmlFor="settings-currency" className={LABEL_CLASSES}>
                  Currency
                </label>
                <select
                  id="settings-currency"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  className={INPUT_CLASSES}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Preview:{' '}
                  {formatCurrency(1234.5, {
                    currency: selectedOption.code,
                    locale: selectedOption.locale,
                  })}
                </p>
              </div>
            </section>

            {/* Data management */}
            <section className="space-y-3">
              <SectionHeading
                icon={Database}
                title="Data Management"
                hint="Erase every transaction and restore defaults."
              />
              <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-3">
                {confirmArmed ? (
                  <div>
                    <p className="flex items-start gap-2 text-xs text-red-300">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        This permanently deletes all{' '}
                        <strong>{expenses.length}</strong> transactions and
                        resets your settings. It cannot be undone.
                      </span>
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleClearData}
                        className={`flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 ${FOCUS_RING_CLASSES}`}
                      >
                        Yes, erase everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmArmed(false)}
                        className={`flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 ${FOCUS_RING_CLASSES}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearData}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/60 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/50 hover:text-red-300 ${FOCUS_RING_CLASSES}`}
                  >
                    Clear All Data
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 ${FOCUS_RING_CLASSES}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmArmed}
              className={`flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING_CLASSES}`}
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
