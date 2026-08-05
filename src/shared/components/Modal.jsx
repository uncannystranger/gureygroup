import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/** Shared popup shell. Add Product is the visual source of truth for this component. */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  labelledBy,
  className = 'max-w-3xl',
  showClose = true,
  closeOnOverlay = true,
}) {
  const generatedId = useId();
  const titleId = labelledBy || generatedId;

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`w-full min-w-0 ${className} glass-panel rounded-3xl sm:rounded-4xl p-5 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain animate-fade-scale`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="sticky top-0 z-10 float-right -mt-1 w-10 h-10 rounded-full bg-slate-200/90 dark:bg-slate-800/95 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/90 dark:hover:bg-slate-700 flex items-center justify-center transition-all btn-micro"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {title && <span id={titleId} className="sr-only">{title}</span>}
        {children}
      </section>
    </div>
  );
}
