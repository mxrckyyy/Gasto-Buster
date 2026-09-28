/**
 * Gasto Buster — useFocusTrap hook.
 *
 * Keyboard focus management for modal dialogs (WCAG 2.1 AA):
 *   1. Focus moves to the dialog's primary control (`[data-autofocus]`) when
 *      the dialog opens, falling back to its first tabbable element.
 *   2. Tab / Shift+Tab cycle within the dialog instead of escaping into the
 *      page behind it.
 *   3. Focus returns to the element that opened the dialog when it closes
 *      (Escape, submit, backdrop click), so keyboard users never lose their
 *      place.
 *
 * Escape-to-close is left to each dialog so nested controls (e.g. the
 * category listbox) can consume Escape first.
 */

import { useEffect, useRef } from 'react';

/** Everything a keyboard user can reach with Tab. */
const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Tabbable elements inside a container, in DOM order. */
function getTabbableElements(container) {
  return Array.from(container.querySelectorAll(TABBABLE_SELECTOR)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true'
  );
}

/**
 * @param {{ containerRef: React.RefObject<HTMLElement|null>, isOpen: boolean }} options
 * @returns {React.RefObject<HTMLElement|null>} The element focused before the dialog opened.
 */
export default function useFocusTrap({ containerRef, isOpen }) {
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const container = containerRef.current;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // 1. Focus the primary control (or the first tabbable element).
    const initialTarget =
      container?.querySelector('[data-autofocus]') ??
      (container ? getTabbableElements(container)[0] : null);
    initialTarget?.focus();

    // 2. Keep Tab / Shift+Tab inside the dialog.
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const dialog = containerRef.current;
      if (!dialog) return;

      const tabbables = getTabbableElements(dialog);
      if (tabbables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const active = document.activeElement;
      const isInside = dialog.contains(active);

      if (event.shiftKey) {
        if (!isInside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!isInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 3. Hand focus back to the trigger on close.
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const previous = previouslyFocusedRef.current;
      if (previous && previous.isConnected && previous !== document.body) {
        previous.focus();
      }
    };
  }, [isOpen, containerRef]);

  return previouslyFocusedRef;
}
