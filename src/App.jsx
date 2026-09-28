/**
 * Gasto Buster — App shell.
 *
 * Renders the full dashboard layout (Header, Summary Cards, Category Chart,
 * Transaction List, and the Add/Edit modal triggers) via the Dashboard view.
 * Global expense state is provided by <ExpenseProvider> in main.jsx.
 */

import Dashboard from './components/dashboard/Dashboard.jsx';

export default function App() {
  return <Dashboard />;
}
