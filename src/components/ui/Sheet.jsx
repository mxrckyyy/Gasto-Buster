/**
 * Gasto Buster — Sheet primitive (modal dialog overlay).
 *
 * Encodes the overlay contract in one place:
 *   - rendered via createPortal into #portal-root (document.body fallback
 *     for jsdom/tests)
 *   - full-screen sheet < md, centered dialog ≥ md
 *   - focus trap + restore to trigger (useFocusTrap)
 *   - body scroll lock with scrollbar-width compensation (useScrollLock)
 *   - Escape closes (bubble phase, so the category listbox can consume
 *     Escape first during the capture phase)
 *   - backdrop click closes
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import useScrollLock from '../../hooks/useScrollLock.js';
import { cn } from '../../utils/cn.js';

/** Portal target from index.html; falls back to body under jsdom. */
export function getPortalRoot() {
  return document.getElementById('portal-root') ?? document.body;
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   label: string,
 *   panelClassName?: string,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function Sheet({
  isOpen,
  onClose,
  label,
  panelClassName,
  className,
  children,
}) {
  const dialogRef = useRef(null);
  useFocusTrap({ containerRef: dialogRef, isOpen });
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-0 md:p-[var(--space-4)]',
        className
      )}
    >
      <div
        className={cn(
          'my-auto flex min-h-full w-full flex-col rounded-none border border-onyx-line bg-surface p-[var(--space-4)] shadow-xl md:min-h-auto md:max-w-md md:rounded-2xl md:p-[var(--space-5)]',
          panelClassName
        )}
      >
        {children}
      </div>
    </div>,
    getPortalRoot()
  );
}
