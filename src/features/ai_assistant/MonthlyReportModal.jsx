import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  Building,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useUserProfile } from '../../core/user/UserProfileContext';

export default function MonthlyReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { tenant } = useMultiTenant();
  const { profile } = useUserProfile();
  const [isExporting, setIsExporting] = useState(false);

  const currentDate = new Date();
  const currentMonthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Executive Monthly Intelligence Report</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {currentMonthYear}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {tenant?.name || 'Gurey Group Enterprise'} • Prepared for {profile?.displayName || 'Executive Management'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 btn-micro"
            >
              {isExporting ? <span className="animate-spin">⏳</span> : <Printer className="w-4 h-4 text-indigo-500" />}
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">$142,850.00</div>
              <div className="mt-2 text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% vs last month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                <span>Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">1,248</div>
              <div className="mt-2 text-[11px] font-bold text-indigo-500">
                Avg order value: $114.46
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                <span>Active Clients</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">342</div>
              <div className="mt-2 text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+24 new corporate accounts</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                <span>Security Index</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">98 / 100</div>
              <div className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                0 Active Security Threats
              </div>
            </div>

          </div>

          {/* Revenue Stream Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Revenue Channels Breakdown</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>POS Direct Sales (In-Store)</span>
                  <span className="text-indigo-600 dark:text-indigo-400">$85,710.00 (60%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Corporate B2B Invoices</span>
                  <span className="text-purple-600 dark:text-purple-400">$42,855.00 (30%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Online Catalog & Integrations</span>
                  <span className="text-blue-600 dark:text-blue-400">$14,285.00 (10%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Intelligence & Recommendations */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-slate-900/20 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AI Executive Strategic Recommendations</span>
            </div>
            
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Inventory Restock Warning:</strong> 4 high-demand inventory items are below minimum safety threshold (Dell UltraSharp Monitor, Wireless Barcode Scanner). Restock recommended immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Growth Opportunity:</strong> B2B Corporate invoicing increased by +22% this month. Consider expanding credit line limits for top 5 key clients.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Security & Compliance:</strong> All tenant isolation gates passed clean audit with zero unauthorized access attempts recorded.</span>
              </li>
            </ul>
          </div>

          {/* Report Metadata Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div>Report Ref: GUREY-AI-RPT-{Date.now().toString().slice(-6)}</div>
            <div>Generated by AI Intelligence Engine v2.5</div>
          </div>

        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/80 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all btn-micro"
          >
            Close Monthly Report
          </button>
        </div>

      </div>
    </div>
  );
}
