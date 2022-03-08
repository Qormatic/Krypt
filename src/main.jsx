import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import { TransactionsProvider } from "./context/TransactionContext";
import './index.css'

// Any values we put into "TransactionsProvider" in "TransactionContext.jsx" will be available to our React app cos its wrapped in <TransactionsProvider>
ReactDOM.render(
  <TransactionsProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransactionsProvider>,
  document.getElementById('root')
)
