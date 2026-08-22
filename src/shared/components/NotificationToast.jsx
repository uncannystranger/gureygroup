import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

const TOAST_LIFETIME_MS = 4500;

export default function NotificationToast() {
  const { notifications, markNotificationRead } = useMultiTenant();

  // Show only unread notifications (up to 3 recent ones)
  const unreadNotifs = notifications.filter(n => !n.isRead).slice(0, 3);

  // The countdown bar promised an auto-dismiss that never happened, so toasts
  // stacked up permanently until each one was clicked away.
  const timersRef = useRef(new Map());
  useEffect(() => {
    const timers = timersRef.current;
    unreadNotifs.forEach((n) => {
      if (timers.has(n.id)) return;
      timers.set(n.id, setTimeout(() => {
        timers.delete(n.id);
        markNotificationRead(n.id);
      }, TOAST_LIFETIME_MS));
    });
    return undefined;
  }, [unreadNotifs, markNotificationRead]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  if (unreadNotifs.length === 0) return null;

  return (
    <div
      className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-auto sm:w-full pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {unreadNotifs.map((n) => {
        let Icon = Info;
        let borderClass = 'border-blue-500/40';
        let iconColor = 'text-blue-500 bg-blue-100 dark:bg-blue-950';
        let barColor = 'bg-blue-500';

        if (n.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/40';
          iconColor = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950';
          barColor = 'bg-emerald-500';
        } else if (n.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/40';
          iconColor = 'text-amber-500 bg-amber-100 dark:bg-amber-950';
          barColor = 'bg-amber-500';
        } else if (n.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/40';
          iconColor = 'text-rose-500 bg-rose-100 dark:bg-rose-950';
          barColor = 'bg-rose-500';
        }

        return (
          <div 
            key={n.id} 
            className={`pointer-events-auto relative overflow-hidden p-3.5 rounded-2xl glass glass-strong border ${borderClass} flex items-start justify-between space-x-3 toast-enter`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{n.title}</h5>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                <span className="text-[9px] font-bold text-slate-400 mt-1 block">{n.timestamp}</span>
              </div>
            </div>

            <button 
              onClick={() => markNotificationRead(n.id)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition-colors shrink-0 btn-micro"
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Auto-Dismiss Countdown Progress Bar Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/40 dark:bg-slate-800/40 overflow-hidden">
              <div className={`h-full ${barColor} animate-toast-progress`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
