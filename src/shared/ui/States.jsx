import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * The three "no content yet" cases every data view needs, drawn from one
 * silhouette so the product feels the same whichever one the user hits.
 */

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="ds-state">
      <span className="ds-state__icon" aria-hidden="true">
        <Icon className="w-5 h-5" />
      </span>
      <p className="ds-heading">{title}</p>
      {description && <p className="ds-caption max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, retryLabel = 'Try again' }) {
  return (
    <div className="ds-state" role="alert">
      <span className="ds-state__icon ds-state__icon--critical" aria-hidden="true">
        <AlertTriangle className="w-5 h-5" />
      </span>
      <p className="ds-heading">{title}</p>
      {description && <p className="ds-caption max-w-sm">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ds-btn ds-btn-secondary ds-btn-sm mt-3">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Skeletons mirror the shape of the content they stand in for, so the layout
 * does not jump when real data arrives.
 */
export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCardGrid({ count = 6, className = '' }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-panel rounded-2xl p-4 space-y-3">
          <SkeletonBlock className="h-24 w-full rounded-xl" />
          <SkeletonBlock className="skeleton-title" />
          <SkeletonBlock className="skeleton-text w-2/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-row w-full rounded-xl" />
      ))}
    </div>
  );
}

/**
 * Renders the right state for an async collection, so screens describe intent
 * instead of repeating the same four-branch conditional.
 */
export function DataBoundary({ status, error, isEmpty, skeleton, empty, onRetry, children }) {
  if (status === 'loading' || status === 'idle') return skeleton ?? <SkeletonRows />;
  if (status === 'error') return <ErrorState description={error} onRetry={onRetry} />;
  if (isEmpty) return empty ?? null;
  return children;
}

/** Live region so screen readers hear background refreshes. */
export function LoadingBar({ label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <span className="ds-progress-line block" />
    </div>
  );
}
