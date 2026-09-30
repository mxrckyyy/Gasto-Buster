/**
 * Gasto Buster — Button primitive.
 *
 * Variants via props (never separate components):
 *   primary        yellow pill, BLACK text (white on yellow fails AA)
 *   secondary      outline on onyx-line
 *   ghost          text-only pill
 *   danger         tinted danger outline
 *   danger-solid   filled danger (confirmation states)
 * Sizes sm/md/lg — all ≥ 44px tall for touch targets.
 */

import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'rounded-full border border-transparent bg-accent text-on-yellow shadow-sm hover:bg-accent-hi active:bg-accent-lo',
  secondary:
    'rounded-lg border border-onyx-line bg-transparent text-gray-100 hover:bg-onyx-soft',
  ghost:
    'rounded-full border border-transparent bg-transparent text-gray-300 hover:bg-onyx-soft hover:text-gray-100',
  danger:
    'rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20',
  'danger-solid':
    'rounded-lg border border-transparent bg-danger text-on-yellow hover:brightness-110',
};

const SIZES = {
  sm: 'min-h-11 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-11 gap-2 px-[var(--space-4)] py-[var(--space-3)] text-sm',
  lg: 'min-h-12 gap-2 px-[var(--space-5)] py-[var(--space-3)] text-base',
};

/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid',
 *   size?: 'sm' | 'md' | 'lg',
 *   type?: 'button' | 'submit' | 'reset',
 *   className?: string,
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
