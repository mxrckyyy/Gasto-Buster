/**
 * Gasto Buster — Sidebar component.
 *
 * Serves as the desktop rail (≥ lg, via PageShell's sidebar slot) and
 * the mobile/tablet drawer content (< lg). The app is a single screen,
 * so this is a utility rail — no invented routes:
 *
 *   logo → brand
 *   quick action → Add Transaction
 *   nav → hash-anchor jump links to the Summary / Spending /
 *          Transaction History sections (existing in-page sections)
 *          + a Reports item that swaps App's main view to the
 *          period reports screen (a view swap, not a route)
 *   stats → total spent, net balance, today vs cap (expanded only)
 *   footer → Settings + collapse toggle (rail only) / nothing in drawer
 *
 * PageShell's slot API decides the mode per surface:
 *   rail:   { collapsed: persisted mode, toggle, closeNav: null }
 *   drawer: { collapsed: false, toggle: null, closeNav }
 * so the drawer always shows full labels and never a collapse toggle.
 */

import { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  PieChart,
  Receipt,
  BarChart3,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import useExpenseContext from '../../hooks/useExpenseContext.js';
import { formatCurrency } from '../../utils/formatters.js';
import { FOCUS_RING_CLASSES } from '../../constants/ui.js';
import Button from '../ui/Button.jsx';
import { cn } from '../../utils/cn.js';

/** In-page jump targets (hash anchors — not router paths). */
const NAV_ITEMS = [
  { id: 'summary', label: 'Summary', icon: LayoutDashboard, href: '#summary-cards' },
  { id: 'spending', label: 'Spending', icon: PieChart, href: '#spending-category' },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    href: '#transaction-history',
  },
];

/** Shared class contract for every nav row (anchor or button). */
const navItemClass = (isActive, isCollapsed) =>
  cn(
    `flex min-h-11 items-center gap-[var(--space-2)] rounded-md px-3 text-sm font-medium transition ${FOCUS_RING_CLASSES}`,
    isCollapsed ? 'justify-center px-0' : 'border-l-2',
    isActive
      ? isCollapsed
        ? 'bg-accent/10 text-accent'
        : 'border-accent bg-accent/10 text-accent'
      : 'border-transparent text-gray-300 hover:bg-onyx-soft hover:text-gray-100'
  );

/**
 * @param {{
 *   collapsed: boolean,
 *   onToggle: (() => void) | null,
 *   onCloseNav: (() => void) | null,
 *   onAddExpense: () => void,
 *   onOpenSettings: () => void,
 *   view?: 'dashboard' | 'periods',
 *   onNavigate?: (view: 'dashboard' | 'periods') => void,
 * }} props
 */
export default function Sidebar({
  collapsed,
  onToggle,
  onCloseNav,
  onAddExpense,
  onOpenSettings,
  view = 'dashboard',
  onNavigate,
}) {
  const { totalExpense, netBalance, todaySpent, settings } = useExpenseContext();
  const [activeId, setActiveId] = useState('summary');

  const currencyOpts = { currency: settings.currency, locale: settings.locale };
  const money = (value) => formatCurrency(value, currencyOpts);
  const cap = Number(settings.dailyAllowance) || 0;

  const handleNavClick = (item, event) => {
    setActiveId(item.id);
    onCloseNav?.();
    // Section jumps only exist on the dashboard: swap views first, then scroll.
    if (view !== 'dashboard') {
      event.preventDefault();
      onNavigate?.('dashboard');
      const targetId = item.href.slice(1);
      requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView());
    }
  };

  const handleReports = () => {
    setActiveId('reports');
    onCloseNav?.();
    onNavigate?.('periods');
  };

  const handleAdd = () => {
    onCloseNav?.();
    onAddExpense();
  };

  const handleSettings = () => {
    onCloseNav?.();
    onOpenSettings();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Brand (pr-11 clears the drawer's floating close button) */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-onyx-line px-[var(--space-3)] py-[var(--space-4)] pr-11',
          collapsed && 'justify-center px-[var(--space-2)]'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-on-yellow">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className={cn('min-w-0', collapsed && 'hidden')}>
          <h1 className="truncate text-base font-bold leading-tight text-gray-100">
            Gasto Buster
          </h1>
          <p className="truncate text-xs text-gray-500">Student Expense Tracker</p>
        </div>
        {collapsed && <h1 className="sr-only">Gasto Buster</h1>}
      </div>

      {/* Quick action */}
      {collapsed ? (
        <div className="flex justify-center py-[var(--space-3)]">
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Add transaction"
            title="Add transaction (keyboard shortcut: N)"
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-yellow shadow-sm transition hover:bg-accent-hi active:bg-accent-lo ${FOCUS_RING_CLASSES}`}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="px-[var(--space-3)] pt-[var(--space-3)]">
          <Button
            onClick={handleAdd}
            title="Add transaction (keyboard shortcut: N)"
            className="w-full"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Add Transaction
          </Button>
        </div>
      )}

      {/* Section jump links */}
      <nav
        aria-label="Sections"
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-[var(--space-3)]',
          collapsed && 'items-center p-[var(--space-2)]'
        )}
      >
        {!collapsed && (
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Jump to
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive ? 'true' : undefined}
              onClick={(event) => handleNavClick(item, event)}
              className={navItemClass(isActive, collapsed)}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </a>
          );
        })}

        {/* Reports — swaps the main view to period reports (a view, not a route) */}
        <button
          type="button"
          onClick={handleReports}
          title={collapsed ? 'Reports' : undefined}
          aria-label={collapsed ? 'Reports' : undefined}
          aria-current={activeId === 'reports' ? 'true' : undefined}
          className={navItemClass(activeId === 'reports', collapsed)}
        >
          <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">Reports</span>}
        </button>
      </nav>

      {/* Overview stats (labels need room — expanded only) */}
      {!collapsed && (
        <div className="mx-[var(--space-3)] mb-[var(--space-3)] rounded-xl border border-onyx-line bg-inset p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Overview
          </p>
          <dl className="mt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-gray-500">Total spent</dt>
              <dd className="text-sm font-semibold tabular-nums text-gray-100">
                {money(totalExpense)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-gray-500">Net balance</dt>
              <dd
                className={`text-sm font-semibold tabular-nums ${
                  netBalance >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {money(netBalance)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-xs text-gray-500">Today</dt>
              <dd className="text-sm font-semibold tabular-nums text-accent">
                {cap > 0 ? `${money(todaySpent)} / ${money(cap)}` : money(todaySpent)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Footer: settings + collapse toggle (rail) */}
      <div className="flex flex-col gap-1 border-t border-onyx-line p-[var(--space-3)]">
        <button
          type="button"
          onClick={handleSettings}
          aria-label="Open settings"
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            `flex min-h-11 items-center gap-[var(--space-2)] rounded-md px-3 text-sm font-medium text-gray-300 transition hover:bg-onyx-soft hover:text-gray-100 ${FOCUS_RING_CLASSES}`,
            collapsed && 'justify-center px-0'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Settings</span>}
        </button>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              `flex min-h-11 items-center gap-[var(--space-2)] rounded-md px-3 text-sm font-medium text-gray-500 transition hover:bg-onyx-soft hover:text-gray-100 ${FOCUS_RING_CLASSES}`,
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}
