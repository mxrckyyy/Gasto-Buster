/**
 * Gasto Buster — CategoryIcon component.
 *
 * Resolves the Lucide icon name declared in `src/constants/categories.js`
 * for a given category id. Shared by the expense form, chart legend, and
 * transaction history so icon mapping lives in exactly one place.
 */

import {
  UtensilsCrossed,
  Bus,
  GraduationCap,
  Repeat,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  Package,
  HandCoins,
  Briefcase,
  Award,
  Gift,
} from 'lucide-react';

/** @type {Record<string, import('lucide-react').LucideIcon>} */
const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  transportation: Bus,
  'school-supplies': GraduationCap,
  subscriptions: Repeat,
  entertainment: Gamepad2,
  health: HeartPulse,
  shopping: ShoppingBag,
  others: Package,
  allowance: HandCoins,
  'part-time-job': Briefcase,
  scholarship: Award,
  gift: Gift,
};

/**
 * Returns the icon component for a category id (Package as fallback).
 *
 * @param {string} categoryId
 * @returns {import('lucide-react').LucideIcon}
 */
export function getCategoryIcon(categoryId) {
  return CATEGORY_ICONS[categoryId] || Package;
}

/**
 * @param {{
 *   categoryId: string,
 *   className?: string,
 *   style?: import('react').CSSProperties,
 * }} props
 */
export default function CategoryIcon({ categoryId, className, style }) {
  const Icon = getCategoryIcon(categoryId);
  return <Icon className={className} style={style} aria-hidden="true" />;
}
