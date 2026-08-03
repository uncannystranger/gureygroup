import React from 'react';
import { Search, CreditCard, Sparkles, Command, SlidersHorizontal, Plus, ArrowUpRight } from 'lucide-react';

export default function Header({ onOpenSearch, onOpenSendModal, activeTabTitle, activeTabSubtitle }) {
  return (
    <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 pb-4 px-2">
      
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activeTabTitle || 'Gurey Group'}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" /> PRO
          </span>
        </div>
        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          {activeTabSubtitle || 'Start managing your finances & intelligent assets'}
        </p>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center space-x-3">
        
        {/* Card Number Pill (from Reference Design) */}
        <div className="hidden lg:flex items-center space-x-4 px-4 py-2 rounded-2xl glass-panel text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold tracking-wider shadow-sm">
          <CreditCard className="w-4 h-4 text-indigo-500" />
          <span>**** 4168</span>
          <span className="text-slate-400 dark:text-slate-500">|</span>
          <span className="text-slate-500 dark:text-slate-400">01/29</span>
        </div>

        {/* Global Floating Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl glass-panel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium hover:scale-[1.02] active:scale-[0.98] group border border-white/60 dark:border-white/10 shadow-sm"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <span className="hidden sm:inline">Search transactions, metrics...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Quick Send Action Pill Button */}
        <button
          onClick={onOpenSendModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>

      </div>

    </header>
  );
}
