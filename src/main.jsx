import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './shared/components/ErrorBoundary.jsx'
import './index.css'

// Global Unhandled Exception & Promise Rejection Handlers
window.addEventListener('error', (event) => {
  console.error('[Gurey Group Global Window Error]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Gurey Group Unhandled Promise Rejection]:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

