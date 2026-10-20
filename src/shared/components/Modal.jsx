import React, { useEffect, useId, useRef } from 'react';
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

  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialogRef.current.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter(node => node.getClientRects().length);
    const frame = requestAnimationFrame(() => (focusable()[0] || dialogRef.current)?.focus());
    const handleKeyDown = (event) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0]; const last = items[items.length - 1];
      if (!items.length) { event.preventDefault(); dialogRef.current.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      if (opener?.isConnected) opener.focus();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay glass-scrim fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6 animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title || labelledBy ? titleId : undefined}
        aria-label={!title && !labelledBy ? "Dialog" : undefined}
        className={`w-full min-w-0 ${className} glass glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain animate-fade-scale`}
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
