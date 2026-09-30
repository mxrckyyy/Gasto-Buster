import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Tokens first: the theme layer in index.css references these variables.
import './styles/tokens.css';
import App from './App.jsx';
import { ExpenseProvider } from './context/ExpenseContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExpenseProvider>
      <App />
    </ExpenseProvider>
  </StrictMode>
);
