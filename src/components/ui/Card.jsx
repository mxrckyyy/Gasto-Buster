/**
 * Gasto Buster — Card primitive.
 *
 * The app's standard surface: bg-surface, 1px onyx-line border,
 * rounded-2xl, shadow-1, fluid padding. `elevated` swaps in
 * bg-elevated + shadow-2 for overlaying surfaces (menus, popovers).
 * `as` lets call sites keep semantic tags (section, article, …).
 */

import { cn } from '../../utils/cn.js';

/**
 * @param {{
 *   elevated?: boolean,
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 * } & React.HTMLAttributes<HTMLElement>} props
 */
export default function Card({
  elevated = false,
  as: Tag = 'div',
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-onyx-line p-[var(--space-4)]',
        elevated ? 'bg-elevated shadow-md' : 'bg-surface shadow-sm',
        className
      )}
      {...props}
    />
  );
}
