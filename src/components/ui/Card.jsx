/**
 * Gasto Buster — Card primitive.
 *
 * The app's standard surface: bg-surface, 1px onyx-line border,
 * rounded-2xl, shadow-1, fluid padding. `elevated` swaps in
 * bg-elevated + shadow-2 for overlaying surfaces (menus, popovers).
 * `as` keeps semantic tags (section, article, …); `pad` selects a
 * fluid padding step so callers never stack conflicting p-* utilities.
 */

import { cn } from '../../utils/cn.js';

const PADS = {
  none: 'p-0',
  3: 'p-[var(--space-3)]',
  4: 'p-[var(--space-4)]',
  5: 'p-[var(--space-5)]',
  6: 'p-[var(--space-6)]',
};

/**
 * @param {{
 *   elevated?: boolean,
 *   pad?: 3 | 4 | 5 | 6 | 'none',
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 * } & React.HTMLAttributes<HTMLElement>} props
 */
export default function Card({
  elevated = false,
  pad = 4,
  as: Tag = 'div',
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-onyx-line',
        PADS[pad] ?? PADS[4],
        elevated ? 'bg-elevated shadow-md' : 'bg-surface shadow-sm',
        className
      )}
      {...props}
    />
  );
}
