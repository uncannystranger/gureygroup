import React, { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * Most catalogue items have no photo. Rendering an <img> with an empty src
 * paints a browser "broken image" glyph, so fall back to a typed placeholder
 * that still identifies the item by its initials.
 */
export default function ProductThumb({ src, name = '', className = '', rounded = 'rounded-xl' }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        className={`grid place-items-center shrink-0 ${rounded} ${className}`}
        style={{ background: 'var(--ds-surface-sunken)', color: 'var(--ds-text-muted)' }}
        role="img"
        aria-label={name ? `${name} — no image` : 'No image'}
      >
        {initials
          ? <span className="text-[11px] font-bold tracking-tight">{initials}</span>
          : <Package className="w-4 h-4" aria-hidden="true" />}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover shrink-0 ${rounded} ${className}`}
    />
  );
}
