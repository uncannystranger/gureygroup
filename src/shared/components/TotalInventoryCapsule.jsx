import React from 'react';
import { Sparkles, Package } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import AnimatedCounter from './AnimatedCounter';

export default function TotalInventoryCapsule() {
  const { totalInventoryValue, totalRetailPotentialValue, activeCompany } = useMultiTenant();
  const { t } = useLanguage();

  return (
    <div className="w-full glass-panel rounded-4xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 card-hover-lift">
      
      {/* Subtle Background Glow Nodes */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left Column: Total Inventory Value */}
        <div>
          <div className="flex items-center justify-between sm:justify-start sm:space-x-6">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              {t('reports.inventory_valuation', 'Total Inventory Value')}
            </span>
            <div className="px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 border border-slate-300/40 dark:border-slate-700/50">
              {activeCompany?.currency || 'USD'} ({activeCompany?.currencySymbol || '$'})
            </div>
          </div>

          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-2xl font-light text-slate-400 dark:text-slate-400">
              {activeCompany?.currencySymbol || '$'}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={totalInventoryValue ?? 0} decimals={2} />
            </span>
          </div>
        </div>

        {/* Badge Indicator */}
        <div className="flex items-center space-x-3 self-start lg:self-auto">
          <span className="px-4 py-2 rounded-full glass-panel border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span>Real-time Inventory Valuation</span>
          </span>
        </div>

      </div>

      {/* Signature 3 Connected Capsule Nodes */}
      <div className="mt-8 pt-4">
        <div className="relative flex items-center justify-center sm:justify-start">
          
          {/* Interconnected Outer Liquid Glass Shell */}
          <div className="inline-flex items-center p-2 rounded-full glass-panel border border-white/80 dark:border-white/10 shadow-lg relative bg-white/40 dark:bg-slate-900/40">
            
            {/* Left Node Capsule: In-Stock Valuation */}
            <div className="px-6 py-4 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 shadow-inner flex flex-col items-center justify-center min-w-[120px] transition-transform hover:scale-105 btn-micro">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                $<AnimatedCounter value={(totalInventoryValue ?? 0) * 0.4} decimals={0} />
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                In-Stock Cost
              </span>
            </div>

            {/* Middle Node Capsule: Glowing Mesh Retail Potential Value */}
            <div className="px-8 py-5 rounded-full capsule-mesh-gradient text-white flex flex-col items-center justify-center min-w-[150px] mx-1 sm:-mx-2 z-10 transition-transform hover:scale-105 shadow-pill-glow btn-micro">
              <span className="text-lg sm:text-xl font-black tracking-tight drop-shadow-sm">
                $<AnimatedCounter value={totalRetailPotentialValue ?? 0} decimals={0} />
              </span>
              <span className="text-xs font-medium text-indigo-100 mt-0.5 tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> Retail Value
              </span>
            </div>

            {/* Right Node Capsule: Warehouse Reserve */}
            <div className="px-6 py-4 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 shadow-inner flex flex-col items-center justify-center min-w-[120px] transition-transform hover:scale-105 btn-micro">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                $<AnimatedCounter value={(totalInventoryValue ?? 0) * 0.6} decimals={0} />
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Reserve Stock
              </span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
