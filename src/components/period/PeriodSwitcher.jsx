/**
 * Gasto Buster — PeriodSwitcher.
 *
 * Week/Month segmented control as an ARIA tablist: the selected tab drives
 * the active period type. Roving tabindex (only the selected tab is
 * Tab-reachable), Arrow keys move + activate, Home/End jump to the ends.
 *
 * Styling: bg-inset track (rounded-full), active segment = accent pill
 * (black-on-yellow), inactive segments gray with onyx hover. Full-width
 * below sm so it never causes horizontal scroll at 320px.
 */

import { useRef } from 'react';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import { cn } from '../../utils/cn.js';

const TABS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

/**
 * @param {{
 *   type: 'week' | 'month',
 *   onChange: (type: 'week' | 'month') => void,
 * }} props
 */
export default function PeriodSwitcher({ type, onChange }) {
  const tabsRef = useRef([]);

  const activate = (index) => {
    tabsRef.current[index]?.focus();
    onChange(TABS[index].id);
  };

  const handleKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    activate(nextIndex);
  };

  return (
    <div
      role="tablist"
      aria-label="Reporting period"
      className="flex w-full rounded-full bg-inset p-1 sm:w-auto"
    >
      {TABS.map((tab, index) => {
        const selected = type === tab.id;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              tabsRef.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`period-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls="period-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'min-h-11 flex-1 rounded-full px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold transition sm:flex-none',
              FOCUS_RING_CLASSES,
              selected
                ? 'bg-accent text-on-yellow shadow-sm'
                : 'text-gray-300 hover:bg-onyx-soft hover:text-gray-100'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
