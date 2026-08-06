import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[Gurey Group ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Unable to clear web storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-[#EBF0F7] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
          <div className="max-w-lg w-full glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center gap-5 animate-fade-in-up">
            
            {/* Warning Icon Container */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl font-black shadow-inner">
              ⚠️
            </div>

            {/* Error Title & Message */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Application Error Detected
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                An unexpected system exception occurred while rendering the application workspace.
              </p>
            </div>

            {/* Exception Preview Box */}
            <div className="w-full text-left bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto max-h-36">
              <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Message:</span>
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            {/* Collapsible Details Button */}
            {this.state.errorInfo && (
              <div className="w-full text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {this.state.showDetails ? '▼ Hide technical stack trace' : '▶ View technical stack trace'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-slate-950 text-emerald-400 rounded-xl text-[10px] leading-normal font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
              >
                Reload Workspace
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Clear Cache & Retry
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
