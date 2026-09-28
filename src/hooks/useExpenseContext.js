/**
 * Gasto Buster — useExpenseContext hook.
 *
 * Consumes ExpenseContext and throws a clear error if invoked
 * outside of an <ExpenseProvider>.
 */

import { useContext } from 'react';
import ExpenseContext from '../context/ExpenseContext.jsx';

/**
 * @returns {React.ContextType<typeof ExpenseContext>}
 *   The full expense context value (state, actions, derived metrics).
 * @throws {Error} If called outside an <ExpenseProvider>.
 */
export default function useExpenseContext() {
  const context = useContext(ExpenseContext);

  if (context === null) {
    throw new Error(
      'useExpenseContext must be used within an <ExpenseProvider>. ' +
        'Wrap your component tree with <ExpenseProvider> in main.jsx or App.jsx.'
    );
  }

  return context;
}
