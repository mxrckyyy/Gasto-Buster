/**
 * Gasto Buster — Grid primitive.
 *
 * Responsive content grids off the fluid stack gap. Presets fill the
 * viewport width at every breakpoint (1 → 2 → 3 → 4 columns) instead
 * of clustering into a centered column.
 */

import { cn } from '../../utils/cn.js';
import { GAPS } from './Stack.jsx';

const COL_PRESETS = {
  one: 'grid-cols-1',
  two: 'grid-cols-1 lg:grid-cols-2',
  stats: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

/**
 * @param {{
 *   cols?: 'one' | 'two' | 'stats' | 'responsive',
 *   gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'stack' | 'section',
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 * } & React.HTMLAttributes<HTMLElement>} props
 */
export default function Grid({
  cols = 'responsive',
  gap = 'stack',
  as: Tag = 'div',
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'grid',
        COL_PRESETS[cols] ?? COL_PRESETS.responsive,
        GAPS[gap] ?? GAPS.stack,
        className
      )}
      {...props}
    />
  );
}
