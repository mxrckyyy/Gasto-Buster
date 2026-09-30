/**
 * Gasto Buster — Stack primitive.
 *
 * Flex gap-based vertical (or wrapping row) spacing off the fluid
 * scale — replaces space-y-* / margin stacks so rhythm tracks the
 * viewport. Prefer this over margins everywhere.
 */

import { cn } from '../../utils/cn.js';

/** Fluid gap presets (token-backed, usable by Grid too). */
export const GAPS = {
  1: 'gap-[var(--space-1)]',
  2: 'gap-[var(--space-2)]',
  3: 'gap-[var(--space-3)]',
  4: 'gap-[var(--space-4)]',
  5: 'gap-[var(--space-5)]',
  6: 'gap-[var(--space-6)]',
  7: 'gap-[var(--space-7)]',
  stack: 'gap-[var(--stack-gap)]',
  section: 'gap-[var(--section-gap)]',
};

/**
 * @param {{
 *   gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'stack' | 'section',
 *   row?: boolean,
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 * } & React.HTMLAttributes<HTMLElement>} props
 */
export default function Stack({
  gap = 'stack',
  row = false,
  as: Tag = 'div',
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        row ? 'flex flex-wrap items-center' : 'flex flex-col',
        GAPS[gap] ?? GAPS.stack,
        className
      )}
      {...props}
    />
  );
}
