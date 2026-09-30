/**
 * Gasto Buster — shared UI class tokens.
 *
 * Single source of truth for cross-component interaction styling so every
 * interactive control ships the same keyboard focus treatment (WCAG 2.1
 * SC 2.4.7 Focus Visible / SC 2.4.11 Focus Not Obscured).
 */

/**
 * Keyboard focus ring applied to every button, input, and select.
 * `.focus-ring` is defined in src/index.css: a solid yellow outline
 * (12:1+ against the onyx surfaces) plus the --focus-ring glow token.
 * `focus-visible` keeps the ring off mouse/touch clicks while
 * guaranteeing a high-contrast indicator for keyboard users.
 */
export const FOCUS_RING_CLASSES = 'focus-ring';
