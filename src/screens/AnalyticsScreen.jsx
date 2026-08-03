import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon, 
  Download, 
  Calendar,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AnalyticsScreen() {
  const [selectedRange, setSelectedRange] = useState('This Quarter');

  const categories = [
    { name: 'SaaS & Tools', percent: 42, color: 'bg-indigo-500', amount: '$30,894' },
    { name: 'Payroll & Operations', percent: 28, color: 'bg-blue-500', amount: '$20,596' },
    { name: 'Cloud Infrastructure', percent: 18, color: 'bg-purple-500', amount: '$13,240' },
    { name: 'Marketing & Ads', percent: 12, color: 'bg-emerald-500', amount: '$8,828' },
  ];

  const regionalData = [
    { country: 'North America', flag: '🇺🇸', revenue: '$42,500', growth: '+18.4%' },
    { country: 'European Union', flag: '🇪🇺', revenue: '$22,100', growth: '+12.1%' },
    { country: 'Asia Pacific', flag: '🇯🇵', revenue: '$8,950', growth: '+24.6%' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Analytics Metrics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics & Intelligence
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Real-time cash flow telemetry & predictive model
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center p-1 rounded-2xl glass-panel text-xs font-bold">
            {['This Month', 'This Quarter', 'Year to Date'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedRange === r 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button 
            onClick={() => alert('Analytics report exported as CSV')}
            className="px-4 py-2 rounded-2xl glass-pill text-xs font-bold flex items-center space-x-2 shadow-xs hover:shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Net Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">$128,450</span>
            <span className="ml-2 text-xs font-bold text-emerald-500 inline-flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Operating Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">$73,558</span>
            <span className="ml-2 text-xs font-bold text-rose-500 inline-flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> -3.1%</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Burn Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">$18,200/mo</span>
            <span className="ml-2 text-xs font-bold text-emerald-500">Safe Runway (38m)</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Profit Margin</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">42.6%</span>
            <span className="ml-2 text-xs font-bold text-emerald-500">+2.4% vs targets</span>
          </div>
        </div>

      </div>

      {/* Main Graph & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cash Flow Forecast Graph */}
        <div className="lg:col-span-8 glass-panel rounded-4xl p-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Cash Flow Forecast
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Monthly revenue vs expenditures projection
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-300" />
                <span className="text-slate-700 dark:text-slate-300">Expenses</span>
              </div>
            </div>
          </div>

          {/* SVG Area Chart Simulation */}
          <div className="w-full h-64 relative pt-4">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 0,140 Q 100,60 200,90 T 400,30 L 500,45 L 500,200 L 0,200 Z"
                fill="url(#revenueGrad)"
              />
              <path
                d="M 0,140 Q 100,60 200,90 T 400,30 L 500,45"
                fill="none"
                stroke="#6366F1"
                strokeWidth="4"
              />

              <path
                d="M 0,170 Q 120,130 250,140 T 500,110"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>

            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-2">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN</span>
              <span>JUL</span>
            </div>
          </div>
        </div>

        {/* Spend Category Breakdown */}
        <div className="lg:col-span-4 glass-panel rounded-4xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Spend by Category
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6">
              Distribution of operating expenses
            </p>

            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{cat.amount} ({cat.percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full transition-all duration-700`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Table Snippet */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-2">
              Top Regional Growth
            </h4>
            <div className="space-y-2">
              {regionalData.map((reg) => (
                <div key={reg.country} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">{reg.flag} {reg.country}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-900 dark:text-white">{reg.revenue}</span>
                    <span className="text-[10px] text-emerald-500 font-extrabold">{reg.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
