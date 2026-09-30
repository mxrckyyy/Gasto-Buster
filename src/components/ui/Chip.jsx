/**
 * Gasto Buster — Chip primitive.
 *
 * Compact pill for counts, statuses, and badges. Tones map to the
 * semantic tokens (accent / success / danger) with tinted backgrounds
 * so chips read on any surface.
 */

import { cn } from '../../utils/cn.js';

const TONES = {
  neutral: 'border-onyx-line bg-onyx-soft text-gray-300',
  accent: 'border-accent/30 bg-accent/10 text-accent',
  success: 'border-success/30 bg-success/10 text-success',
  danger: 'border-danger/30 bg-danger/10 text-danger',
};

/**
 * @param {{
 *   tone?: 'neutral' | 'accent' | 'success' | 'danger',
 *   className?: string,
 * } & React.HTMLAttributes<HTMLSpanElement>} props
 */
export default function Chip({ tone = 'neutral', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-[var(--space-2)] py-1 text-xs font-medium tabular-nums',
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
