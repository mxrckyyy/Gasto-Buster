/**
 * Gasto Buster — SettingsModal component.
 *
 * Configure the daily allowance cap and preferred currency, and manage
 * stored data (double-confirmed wipe). Every save passes through
 * `settingsSchema` (Zod) and syncs via ExpenseContext's `updateSettings`,
 * so changes appear instantly across the header, banner, and cards.
 *
 * Overlay mechanics live in the Sheet primitive (portal, focus trap,
 * scroll lock, Escape, full-screen < md / centered ≥ md).
 */

import { useEffect, useRef, useState } from 'react';
import { X, Wallet, Coins, Database, AlertTriangle } from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { settingsSchema, formatZodErrors } from '../../utils/validation.js';
import { CURRENCY_OPTIONS } from '../../constants/categories.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import { formatCurrency, formatCurrencySymbol } from '../../utils/formatters.js';
import Sheet from '../ui/Sheet.jsx';
import Input, { FIELD_CLASSES } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import Stack from '../ui/Stack.jsx';

const LABEL_CLASSES =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-300';

/** Section heading with an icon. */
function SectionHeading({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500">{hint}</p>
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
    onCloseRef.current();
  };

  // Double confirmation: arm first, execute on the second press.
  const handleClearData = () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    clearAllData();
    onCloseRef.current();
  };

  // Enter inside any field saves — the dialog is a real <form> so keyboard
  // users never need to reach for the mouse (WCAG 2.1.1 Keyboard).
  const handleFormSubmit = (event) => {
    event.preventDefault();
    handleSave();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} label="Settings">
      {/* Header */}
      <div className="mb-[var(--space-4)] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100">Settings</h2>
          <p className="text-xs text-gray-500">
            Stored locally in your browser only.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-onyx-soft hover:text-gray-100 ${FOCUS_RING_CLASSES}`}
          aria-label="Close settings"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} noValidate>
        <Stack gap="5">
          {/* Daily allowance cap */}
          <section className="flex flex-col gap-3">
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
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  aria-hidden="true"
                >
                  {formatCurrencySymbol(selectedOption.code, selectedOption.locale)}
                </span>
                <Input
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
                  className="pl-9"
                />
              </div>
              {allowanceError ? (
                <p
                  id="settings-allowance-error"
                  className="mt-1 text-xs text-danger"
                  role="alert"
                >
                  {allowanceError}
                </p>
              ) : (
                <p id="settings-allowance-hint" className="mt-1 text-xs text-gray-500">
                  Set 0 to disable the daily cap.
                </p>
              )}
            </div>
          </section>

          {/* Currency */}
          <section className="flex flex-col gap-3">
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
                className={FIELD_CLASSES}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Preview:{' '}
                {formatCurrency(1234.5, {
                  currency: selectedOption.code,
                  locale: selectedOption.locale,
                })}
              </p>
            </div>
          </section>

          {/* Data management */}
          <section className="flex flex-col gap-3">
            <SectionHeading
              icon={Database}
              title="Data Management"
              hint="Erase every transaction and restore defaults."
            />
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
              {confirmArmed ? (
                <div>
                  <p className="flex items-start gap-2 text-xs text-danger">
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
                    <Button
                      variant="danger-solid"
                      size="sm"
                      onClick={handleClearData}
                      className="flex-1"
                    >
                      Yes, erase everything
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmArmed(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearData}
                  className="w-full"
                >
                  Clear All Data
                </Button>
              )}
            </div>
          </section>
        </Stack>

        {/* Actions */}
        <Stack gap="3" row className="mt-[var(--space-5)]">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={confirmArmed} className="flex-1">
            Save Settings
          </Button>
        </Stack>
      </form>
    </Sheet>
  );
}
