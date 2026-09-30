/**
 * Gasto Buster — className join helper.
 *
 * Tiny local alternative to clsx/tailwind-merge (no new dependency):
 * joins truthy class fragments in order. Conflicting utilities are
 * resolved by convention — callers pass conditional classes AFTER the
 * primitive's base classes.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
