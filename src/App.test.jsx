/**
 * Gasto Buster — App shell / period-view wiring tests.
 *
 * Renders the real tree (PageShell + Sidebar + views + export menu) in
 * jsdom to lock the feature-level contract:
 *   - in-place view toggle (dashboard ⇄ Reports), no router
 *   - Week/Month switch, prev/next/Today navigation, aria-live label
 *   - period totals/delta/list filtering against a seeded fixture
 *   - export menu: exactly two CSV items, Esc closes, focus restores
 *   - client-side download + "Exported <filename>" announcement
 *   - the full tree mounts WITHOUT emitting React warnings
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseProvider } from './context/ExpenseContext.jsx';
import App from './App.jsx';
import { formatPeriodLabel } from './utils/formatters.js';
import { getNextPeriod, getMonthRange, getWeekRange } from './lib/periods.js';

function renderApp() {
  return render(
    <ExpenseProvider>
      <App />
    </ExpenseProvider>
  );
}

/**
 * Seeds two records:
 *   - an expense TODAY (inside the current week/month → counted)
 *   - an expense ~2 months ago (outside every visible range → excluded)
 * Expected in-period total: ₱100.00 with NO baseline last week ("—").
 */
function seedExpenses() {
  const today = new Date();
  const longAgo = new Date();
  longAgo.setDate(15);
  longAgo.setMonth(longAgo.getMonth() - 2);

  const iso = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };

  window.localStorage.setItem(
    'gasto-buster:expenses',
    JSON.stringify([
      {
        id: 'exp_week',
        title: 'Weekly lunch',
        amount: 100,
        category: 'food',
        type: 'expense',
        date: iso(today),
        note: '',
        createdAt: `${iso(today)}T08:00:00Z`,
      },
      {
        id: 'exp_old',
        title: 'Long ago purchase',
        amount: 999,
        category: 'shopping',
        type: 'expense',
        date: iso(longAgo),
        note: '',
        createdAt: `${iso(longAgo)}T08:00:00Z`,
      },
    ])
  );
}

/** Waits for the lazy CategoryChart to resolve inside its Suspense boundary. */
function waitForChart() {
  return screen.findByText(/Spending by Category|No expense data yet/);
}

describe('App — view toggle', () => {
  it('renders the dashboard by default and swaps to Reports and back', async () => {
    const user = userEvent.setup();
    renderApp();

    const main = screen.getByRole('main');
    // The sidebar also has an Add Transaction button — scope to main.
    expect(
      within(main).getByRole('button', { name: /add transaction/i })
    ).toBeInTheDocument();
    expect(
      within(main).queryByRole('heading', { name: 'Reports', level: 2 })
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Reports' }));
    expect(
      within(main).getByRole('heading', { name: 'Reports', level: 2 })
    ).toBeInTheDocument();
    expect(
      within(main).queryByRole('button', { name: /add transaction/i })
    ).toBeNull();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await waitForChart();

    // A section jump link swaps back to the dashboard and scrolls to it
    // (the scroll happens on the next animation frame after the swap).
    await user.click(screen.getByRole('link', { name: 'Summary' }));
    expect(
      within(main).getByRole('button', { name: /add transaction/i })
    ).toBeInTheDocument();
    // Dashboard keeps its legacy all-data export button.
    expect(
      within(main).getByRole('button', { name: 'Export CSV' })
    ).toBeInTheDocument();
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });
});

describe('Period controls', () => {
  it('switches Week ⇄ Month, swaps nav aria-labels, and announces the range', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await waitForChart();

    // The navigator's label <p> (the panel also holds the export status
    // live region, so scope the query to the paragraph).
    const liveLabel = document.querySelector('#period-panel p[aria-live="polite"]');
    expect(liveLabel).not.toBeNull();
    expect(liveLabel).toHaveTextContent(
      formatPeriodLabel(getWeekRange(new Date()), { type: 'week', locale: 'en-PH' })
    );

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    expect(liveLabel).toHaveTextContent(
      formatPeriodLabel(getMonthRange(new Date()), { type: 'month', locale: 'en-PH' })
    );

    // Prev / next move exactly one month and update the announced label.
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(liveLabel).toHaveTextContent(
      formatPeriodLabel(
        getNextPeriod(getMonthRange(new Date()), 'month'),
        { type: 'month', locale: 'en-PH' }
      )
    );

    // Today resets the anchor back to the current month.
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(liveLabel).toHaveTextContent(
      formatPeriodLabel(getMonthRange(new Date()), { type: 'month', locale: 'en-PH' })
    );
  });

  it('moves between tabs with arrow keys (roving tabindex)', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await waitForChart();

    const weekTab = screen.getByRole('tab', { name: 'Week' });
    const monthTab = screen.getByRole('tab', { name: 'Month' });

    // Only the selected tab is Tab-reachable.
    expect(weekTab).toHaveAttribute('tabindex', '0');
    expect(monthTab).toHaveAttribute('tabindex', '-1');

    weekTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(monthTab).toHaveAttribute('aria-selected', 'true');
    expect(monthTab).toHaveFocus();
    expect(monthTab).toHaveAttribute('tabindex', '0');

    await user.keyboard('{ArrowLeft}');
    expect(weekTab).toHaveAttribute('aria-selected', 'true');
    expect(weekTab).toHaveFocus();

    await user.keyboard('{End}');
    expect(monthTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(weekTab).toHaveAttribute('aria-selected', 'true');
  });

  it('totals, delta, and list reflect only the visible period', async () => {
    seedExpenses();
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await waitForChart();

    // Total spent in the current week = the one in-period expense; the
    // previous week had none, so percent renders as "—" (never NaN).
    const deltaLine = screen.getByText(/vs previous week/);
    const summaryCard = deltaLine.closest('section');
    expect(summaryCard).toHaveTextContent('₱100.00'); // total + absolute delta
    expect(summaryCard).toHaveTextContent('—'); // percent null — no baseline

    // The list shows the in-period record and hides the out-of-period one.
    expect(screen.getByText('Weekly lunch')).toBeInTheDocument();
    expect(screen.queryByText('Long ago purchase')).toBeNull();
  });
});

describe('ExportMenu', () => {
  it('offers exactly two CSV items; Escape closes and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await waitForChart();

    const trigger = screen.getByRole('button', { name: 'Export CSV' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Export options' });
    const items = within(dialog).getAllByRole('button');
    expect(items.map((item) => item.textContent.trim())).toEqual([
      'Export this period (CSV)',
      'Export all data (CSV)',
    ]);
    expect(dialog.textContent).not.toMatch(/json|pdf/i);
    expect(document.activeElement).toBe(items[0]); // data-autofocus

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Export options' })).toBeNull()
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('downloads the period CSV offline and announces the filename', async () => {
    const user = userEvent.setup();

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:gb-test');
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      renderApp();
      await user.click(screen.getByRole('button', { name: 'Reports' }));
      await waitForChart();

      await user.click(screen.getByRole('button', { name: 'Export CSV' }));
      const dialog = await screen.findByRole('dialog', { name: 'Export options' });
      await user.click(
        within(dialog).getByRole('button', { name: 'Export this period (CSV)' })
      );

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          /^Exported gasto-buster_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
        )
      );
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:gb-test');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      // Menu closed after the download; focus is back on the trigger.
      expect(screen.queryByRole('dialog', { name: 'Export options' })).toBeNull();
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Export CSV' })
      );
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});

describe('No React warnings', () => {
  it('renders, switches views, navigates periods, and opens the menu silently', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    try {
      renderApp();
      await waitForChart();

      await user.click(screen.getByRole('button', { name: 'Reports' }));
      await waitForChart();

      await user.click(screen.getByRole('tab', { name: 'Month' }));
      await user.click(screen.getByRole('button', { name: 'Previous month' }));
      await user.click(screen.getByRole('button', { name: 'Today' }));

      await user.click(screen.getByRole('button', { name: 'Export CSV' }));
      await screen.findByRole('dialog', { name: 'Export options' });
      await user.keyboard('{Escape}');

      expect(errorSpy.mock.calls).toEqual([]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
