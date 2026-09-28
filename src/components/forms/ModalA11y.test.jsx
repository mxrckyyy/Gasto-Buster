/**
 * Gasto Buster — modal accessibility & keyboard navigation tests.
 *
 * Locks in the WCAG 2.1 AA requirements audited in Phase 5:
 *   - labelled form controls
 *   - focus moves to the primary field on open
 *   - Tab / Shift+Tab are trapped inside the dialog
 *   - Escape closes (nested listbox first) and restores focus to the trigger
 *   - Enter submits without a mouse
 */

import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExpenseProvider } from '../../context/ExpenseContext.jsx';
import ExpenseFormModal from './ExpenseFormModal.jsx';
import SettingsModal from './SettingsModal.jsx';

function ExpenseModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open add form
      </button>
      <ExpenseFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

function SettingsModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open settings
      </button>
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

function renderExpenseModal() {
  return render(
    <ExpenseProvider>
      <ExpenseModalHarness />
    </ExpenseProvider>
  );
}

function renderSettingsModal() {
  return render(
    <ExpenseProvider>
      <SettingsModalHarness />
    </ExpenseProvider>
  );
}

describe('ExpenseFormModal — keyboard & focus', () => {
  it('associates every field with a label or group name', async () => {
    const user = userEvent.setup();
    renderExpenseModal();
    await user.click(screen.getByRole('button', { name: 'Open add form' }));

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText(/Note/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.getElementById('expense-category')).toHaveAttribute(
      'aria-haspopup',
      'listbox'
    );
  });

  it('moves focus to the primary field (Title) when the dialog opens', async () => {
    const user = userEvent.setup();
    renderExpenseModal();

    const trigger = screen.getByRole('button', { name: 'Open add form' });
    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Add transaction' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveFocus();
  });

  it('traps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderExpenseModal();
    await user.click(screen.getByRole('button', { name: 'Open add form' }));

    const submit = screen.getByRole('button', { name: 'Add Transaction' });
    const closeButton = screen.getByRole('button', { name: 'Close modal' });

    submit.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(submit).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger button', async () => {
    const user = userEvent.setup();
    renderExpenseModal();

    const trigger = screen.getByRole('button', { name: 'Open add form' });
    await user.click(trigger);
    expect(screen.getByLabelText('Title')).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape from the trigger and also restores focus', async () => {
    const user = userEvent.setup();
    renderExpenseModal();

    const trigger = screen.getByRole('button', { name: 'Open add form' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('submits from the keyboard and reports validation errors inline', async () => {
    const user = userEvent.setup();
    renderExpenseModal();

    await user.click(screen.getByRole('button', { name: 'Open add form' }));
    // Focus starts on Title (autofocus); Enter submits the native <form>.
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Title is required.')).toHaveAttribute(
      'role',
      'alert'
    );
    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dismisses the category listbox with Escape before closing the dialog', async () => {
    const user = userEvent.setup();
    renderExpenseModal();
    await user.click(screen.getByRole('button', { name: 'Open add form' }));

    const categoryToggle = document.getElementById('expense-category');
    await user.click(categoryToggle);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(categoryToggle).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lets keyboard users pick a category from the listbox', async () => {
    const user = userEvent.setup();
    renderExpenseModal();
    await user.click(screen.getByRole('button', { name: 'Open add form' }));

    await user.click(document.getElementById('expense-category'));
    await user.click(screen.getByRole('option', { name: 'Transportation' }));

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.getElementById('expense-category')).toHaveTextContent(
      'Transportation'
    );
    expect(document.getElementById('expense-category')).toHaveFocus();
  });
});

describe('SettingsModal — keyboard & focus', () => {
  it('labels the settings fields', async () => {
    const user = userEvent.setup();
    renderSettingsModal();
    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cap per day')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close settings' })).toBeInTheDocument();
  });

  it('moves focus to the allowance field when the dialog opens', async () => {
    const user = userEvent.setup();
    renderSettingsModal();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByLabelText('Cap per day')).toHaveFocus();
  });

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderSettingsModal();
    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    const save = screen.getByRole('button', { name: 'Save Settings' });
    save.focus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Close settings' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it('saves on Enter from the allowance field without a mouse', async () => {
    const user = userEvent.setup();
    renderSettingsModal();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const allowance = screen.getByLabelText('Cap per day');
    await user.clear(allowance);
    await user.keyboard('250');
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open settings' })).toHaveFocus();
    expect(screen.queryByLabelText('Cap per day')).toBeNull();
  });

  it('closes on Escape and restores focus to the trigger button', async () => {
    const user = userEvent.setup();
    renderSettingsModal();

    const trigger = screen.getByRole('button', { name: 'Open settings' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
