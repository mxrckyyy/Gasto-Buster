/**
 * Gasto Buster — usePrefersReducedMotion hook.
 *
 * Motion gating for JS-driven animation (drawer slide, sidebar width
 * transition). CSS-side animation is additionally gated by the
 * prefers-reduced-motion media query in src/index.css.
 */

import useMediaQuery from './useMediaQuery.js';

/** @returns {boolean} True when the user prefers reduced motion. */
export default function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
