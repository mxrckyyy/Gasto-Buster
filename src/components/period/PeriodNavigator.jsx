/**
 * Gasto Buster — PeriodNavigator.
 *
 * prev / label / next + Today. The centered label is an aria-live region,
 * so changing period (switch, prev/next, Today) is announced politely.
 * Icon-only prev/next are 44×44 ghost buttons with explicit
 * "Previous/Next week|month" aria-labels; the row wraps below sm so the
 * label can shrink (truncate) and the Today chip drops to a second row —
 * no horizontal scroll at 320px.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import Button from '../ui/Button.jsx';
import { cn } from '../../utils/cn.js';

const NAV_BUTTON_CLASSES = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-onyx-soft hover:text-gray-100 ${FOCUS_RING_CLASSES}`;

/**
 * @param {{
 *   type: 'week' | 'month',
 *   label: string,
 *   onPrev: () => void,
 *   onNext: () => void,
 *   onToday: () => void,
 * }} props
 */
export default function PeriodNavigator({ type, label, onPrev, onNext, onToday }) {
  const noun = type === 'month' ? 'month' : 'week';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label={`Previous ${noun}`}
          className={NAV_BUTTON_CLASSES}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <p
          aria-live="polite"
          className={cn('min-w-0 truncate px-1 text-sm font-semibold text-gray-100')}
        >
          {label}
        </p>

        <button
          type="button"
          onClick={onNext}
          aria-label={`Next ${noun}`}
          className={NAV_BUTTON_CLASSES}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <Button variant="secondary" size="sm" onClick={onToday}>
        Today
      </Button>
    </div>
  );
}
