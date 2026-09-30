/**
 * Gasto Buster — PageShell primitive.
 *
 * Encodes the full-width responsive layout strategy so every screen
 * inherits it for free:
 *
 *   - root fills the viewport (min-h-100dvh, w-full) with fluid
 *     --gutter padding on <main>; never a narrow centered column
 *   - ≥ lg: persistent sidebar + main fills the remaining width; the
 *     shell is a CSS grid whose track is literally var(--sidebar-w),
 *     so flipping data-sidebar="collapsed" reflows the whole layout
 *   - < lg: sidebar is hidden; `header({ openNav })` wires a hamburger
 *     that opens the sidebar as a left drawer (portal, scrim, focus
 *     trap, Esc, scroll lock) — drawer state is NOT persisted
 *   - motion (width transition, drawer slide) is gated by
 *     usePrefersReducedMotion
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import useSidebarState from '../../hooks/useSidebarState.js';
import useScrollLock from '../../hooks/useScrollLock.js';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { getPortalRoot } from './Sheet.jsx';
import { cn } from '../../utils/cn.js';

const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * @param {{
 *   header?: React.ReactNode | ((api: { openNav: () => void }) => React.ReactNode),
 *   sidebar?: React.ReactNode | ((api: {
 *     collapsed: boolean,
 *     toggle: (() => void) | null,
 *     closeNav: (() => void) | null,
 *   }) => React.ReactNode),
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function PageShell({ header, sidebar, children, className }) {
  const { mode, toggle } = useSidebarState();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const prefersReducedMotion = usePrefersReducedMotion();
  const drawerRef = useRef(null);

  const openNav = () => setIsDrawerOpen(true);
  const closeNav = () => setIsDrawerOpen(false);

  // The drawer is a < lg pattern: crossing to desktop dismisses it.
  useEffect(() => {
    if (isDesktop) setIsDrawerOpen(false);
  }, [isDesktop]);

  useFocusTrap({ containerRef: drawerRef, isOpen: isDrawerOpen && !isDesktop });
  useScrollLock(isDrawerOpen);

  // Esc closes the drawer (sheets own their own Escape layering).
  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeNav();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const sidebarFn = typeof sidebar === 'function' ? sidebar : null;
  const headerNode = typeof header === 'function' ? header({ openNav }) : header;
  const hasSidebar = Boolean(sidebar);

  // Desktop rail reflects persisted mode; the drawer always shows the
  // expanded content (a 72px icon rail inside an 85vw drawer makes no
  // sense) and hides the collapse toggle.
  const railNode = sidebarFn
    ? sidebarFn({ collapsed: mode === 'collapsed', toggle, closeNav: null })
    : sidebar;
  const drawerNode = sidebarFn
    ? sidebarFn({ collapsed: false, toggle: null, closeNav })
    : sidebar;

  return (
    <div
      data-sidebar={mode}
      className={cn(
        'relative min-h-[100dvh] w-full bg-base text-gray-100',
        'lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]',
        !prefersReducedMotion && 'app-shell-motion',
        className
      )}
    >
      {hasSidebar && (
        <aside
          aria-label="Sidebar"
          className="sticky top-0 hidden h-[100dvh] flex-col self-start overflow-hidden border-r border-onyx-line bg-surface lg:flex"
        >
          {railNode}
        </aside>
      )}

      <div className="flex min-w-0 flex-col">
        {headerNode}
        <main className="flex w-full min-w-0 flex-1 flex-col gap-[var(--section-gap)] px-[var(--gutter)] py-[var(--space-5)]">
          {children}
        </main>
      </div>

      {hasSidebar && isDrawerOpen && !isDesktop
        ? createPortal(
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-0 z-50 flex lg:hidden"
            >
              <div
                aria-hidden="true"
                onMouseDown={closeNav}
                className={cn(
                  'absolute inset-0 bg-black/60 backdrop-blur-sm',
                  !prefersReducedMotion && 'scrim-enter'
                )}
              />
              <div
                className={cn(
                  'relative flex h-full w-[min(85vw,320px)] flex-col border-r border-onyx-line bg-surface shadow-xl',
                  !prefersReducedMotion && 'drawer-enter'
                )}
              >
                <button
                  type="button"
                  data-autofocus
                  onClick={closeNav}
                  aria-label="Close navigation menu"
                  className="focus-ring absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-gray-300 transition hover:bg-onyx-soft hover:text-gray-100"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
                {drawerNode}
              </div>
            </div>,
            getPortalRoot()
          )
        : null}
    </div>
  );
}
