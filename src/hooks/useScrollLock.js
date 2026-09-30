/**
 * Gasto Buster — useScrollLock hook.
 *
 * Locks body scroll while an overlay (sheet, drawer) is open and
 * compensates for the disappearing scrollbar width so the page behind
 * never shifts horizontally (WCAG 2.2 SC 2.4.11 / layout stability).
 * Reference-counted so nested overlays (drawer → sheet) restore the
 * original styles exactly once.
 */

import { useEffect } from 'react';

let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

/**
 * @param {boolean} isActive - Lock while true; unlock when it flips false.
 */
export default function useScrollLock(isActive) {
  useEffect(() => {
    if (!isActive) return undefined;

    if (lockCount === 0) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      previousOverflow = document.body.style.overflow;
      previousPaddingRight = document.body.style.paddingRight;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      }
    };
  }, [isActive]);
}
