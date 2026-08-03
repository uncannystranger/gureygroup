import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Sparkles } from 'lucide-react';

export default function TotalBalanceCapsule({ onOpenSendModal }) {
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="w-full glass-panel rounded-4xl p-6 md:p-8 relative overflow-hidden transition-all duration-300">
      
      {/* Background Subtle Glow Nodes */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left Column: Total Balance & Currency Toggle */}
        <div>
          <div className="flex items-center justify-between sm:justify-start sm:space-x-6">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              Total Balance
            </span>
            {/* Currency Selector Pill */}
            <div className="flex items-center p-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50 text-[11px] font-bold">
              <button
                onClick={() => setCurrency('EUR')}
                className={`px-3 py-1 rounded-full transition-all ${
                  currency === 'EUR' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                EUR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-full transition-all ${
                  currency === 'USD' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-light text-slate-400 dark:text-slate-400">
              {currency === 'USD' ? '$' : '€'}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {currency === 'USD' ? '73,558.00' : '67,820.50'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 self-start lg:self-auto">
          <button 
            onClick={onOpenSendModal}
            className="px-6 py-3 rounded-full glass-pill text-slate-800 dark:text-white text-xs font-bold flex items-center space-x-2 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>Receive Money</span>
          </button>
          
          <button 
            onClick={onOpenSendModal}
            className="px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Send Money</span>
          </button>
        </div>

      </div>

      {/* Signature Connected Capsule Nodes (from Reference Image) */}
      <div className="mt-8 pt-4">
        <div className="relative flex items-center justify-center sm:justify-start">
          
          {/* Interconnected Outer Liquid Glass Shell Container */}
          <div className="inline-flex items-center p-2 rounded-full glass-panel border border-white/80 dark:border-white/10 shadow-lg relative bg-white/40 dark:bg-slate-900/40">
            
            {/* Left Node Capsule: Visa */}
            <div className="px-6 py-4 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 shadow-inner flex flex-col items-center justify-center min-w-[120px] transition-transform hover:scale-105">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                $10,208
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Visa
              </span>
            </div>

            {/* Middle Node Capsule: Mastercard (Glowing Mesh Capsule from Reference) */}
            <div className="px-8 py-5 rounded-full capsule-mesh-gradient text-white flex flex-col items-center justify-center min-w-[150px] mx-1 sm:-mx-2 z-10 transition-transform hover:scale-105 shadow-pill-glow">
              <span className="text-lg sm:text-xl font-black tracking-tight drop-shadow-sm">
                $23,558
              </span>
              <span className="text-xs font-medium text-indigo-100 mt-0.5 tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Mastercard
              </span>
            </div>

            {/* Right Node Capsule: Savings */}
            <div className="px-6 py-4 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 shadow-inner flex flex-col items-center justify-center min-w-[120px] transition-transform hover:scale-105">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                $39,792
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Savings
              </span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
