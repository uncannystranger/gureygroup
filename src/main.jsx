import React from 'react'
import ReactDOM from 'react-dom/client'
// Load the workspace inside React so dependency/configuration failures reach
// the error boundary instead of leaving an empty document.
const App = React.lazy(() => import('./App.jsx'));
import ErrorBoundary from './shared/components/ErrorBoundary.jsx'
import './index.css'
import { purgeLegacyClientStores } from './core/storageCleanup'

// Business data used to be kept in localStorage; drop any stale copies before
// the app renders so nothing can read them.
purgeLegacyClientStores();

// Global Unhandled Exception & Promise Rejection Handlers
window.addEventListener('error', (event) => {
  console.error('[Gurey Group Global Window Error]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Gurey Group Unhandled Promise Rejection]:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={
      <main className="min-h-screen grid place-items-center p-6 bg-[#0B0F17] text-slate-100">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center space-y-4" role="alert">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Gurey Group</p>
          <h1 className="text-2xl font-bold">Workspace unavailable</h1>
          <p className="text-sm text-slate-300">We couldn't open this workspace. Reload to try again. If this continues, contact your workspace administrator.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold">Reload workspace</button>
        </section>
      </main>
    }>
      <React.Suspense fallback={<main className="min-h-screen grid place-items-center bg-[#0B0F17] text-slate-100" role="status" aria-live="polite">Opening workspace…</main>}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
)

