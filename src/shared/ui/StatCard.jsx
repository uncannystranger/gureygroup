import React from 'react';

/**
 * One shape for every headline metric in the product: an eyebrow that names
 * the measure, the value, and an optional supporting line. Keeping these
 * identical everywhere is what makes a dashboard scannable.
 */
export default function StatCard({
  label,
  value,
  support,
  icon: Icon,
  tone = 'neutral',
  index = 0,
  className = '',
}) {
  const toneColor = {
    neutral: 'var(--ds-text)',
    positive: 'var(--ds-positive)',
    warning: 'var(--ds-warning)',
    critical: 'var(--ds-critical)',
    accent: 'var(--ds-accent)',
  }[tone] || 'var(--ds-text)';

  const toneSoft = {
    neutral: 'var(--ds-surface-sunken)',
    positive: 'var(--ds-positive-soft)',
    warning: 'var(--ds-warning-soft)',
    critical: 'var(--ds-critical-soft)',
    accent: 'var(--ds-accent-soft)',
  }[tone] || 'var(--ds-surface-sunken)';

  return (
    <div
      className={`glass-panel ds-interactive ds-rise rounded-2xl p-4 min-w-0 ${className}`}
      style={{ '--ds-index': index }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="ds-eyebrow leading-tight [overflow-wrap:anywhere]">{label}</span>
        {Icon && (
          <span
            className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: toneSoft, color: toneColor }}
            aria-hidden="true"
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <p className="ds-numeric mt-2.5 text-2xl font-extrabold leading-none" style={{ color: toneColor }}>
        {value}
      </p>
      {support && <p className="ds-caption mt-1.5 leading-snug">{support}</p>}
    </div>
  );
}
