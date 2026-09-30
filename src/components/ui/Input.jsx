/**
 * Gasto Buster — Input primitive (and shared field chrome).
 *
 * FIELD_CLASSES is the single definition of the app's control styling:
 * bg-inset, onyx-line border, gray-100 text, gray-500 placeholder,
 * yellow focus. Native <select>s import it directly; text fields and
 * textareas go through <Input as="...">. Invalid state is driven by
 * the existing aria-invalid attribute (see [aria-invalid] rule in
 * src/index.css), so no duplicate border classes ever conflict.
 */

import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

export const FIELD_CLASSES =
  'w-full min-h-11 rounded-lg border border-onyx-line bg-inset px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 transition focus:border-accent focus-ring';

/**
 * @param {{
 *   as?: 'input' | 'textarea' | 'select',
 *   className?: string,
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
const Input = forwardRef(function Input(
  { as: Tag = 'input', className, ...props },
  ref
) {
  return <Tag ref={ref} className={cn(FIELD_CLASSES, className)} {...props} />;
});

export default Input;
