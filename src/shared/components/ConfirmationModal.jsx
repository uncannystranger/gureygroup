import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-4xl p-6 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 space-y-4 animate-fade-scale">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-500 flex items-center justify-center shrink-0 border border-rose-300">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-300 transition-colors btn-micro"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md hover:scale-105 transition-all btn-micro ${
              confirmVariant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 dark:bg-white dark:text-slate-950'
            }`}
          >
            {t('common.confirm', confirmText)}
          </button>
        </div>

      </div>
    </div>
  );
}
