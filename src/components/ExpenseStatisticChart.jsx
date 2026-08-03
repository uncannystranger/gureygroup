import React, { useState } from 'react';
import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';

export default function ExpenseStatisticChart() {
  const [timeframe, setTimeframe] = useState('Monthly');
  const [activeBar, setActiveBar] = useState('JUL');

  const data = [
    { month: 'MAY', value: 45, height: 'h-24' },
    { month: 'JUN', value: 30, height: 'h-16' },
    { month: 'JUL', value: 85, height: 'h-36', active: true, amount: '$45k' },
    { month: 'AUG', value: 55, height: 'h-28' },
    { month: 'SEP', value: 40, height: 'h-20' },
  ];

  return (
    <div className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between h-full min-h-[300px]">
      
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            Expense statistic
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> +12.4% vs last period
          </p>
        </div>

        {/* Timeframe Selector Pill */}
        <div className="relative">
          <button 
            onClick={() => setTimeframe(timeframe === 'Monthly' ? 'Weekly' : 'Monthly')}
            className="px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold shadow-sm hover:bg-white flex items-center space-x-1.5 transition-all"
          >
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Bar Graph Canvas */}
      <div className="flex items-end justify-between px-2 pt-8 pb-2 gap-3 sm:gap-4">
        {data.map((item) => {
          const isSelected = activeBar === item.month;
          return (
            <div 
              key={item.month}
              onClick={() => setActiveBar(item.month)}
              className="flex flex-col items-center flex-1 cursor-pointer group relative"
            >
              {/* Active Floating Tooltip Badge ($45k) */}
              {isSelected && (
                <div className="absolute -top-10 flex flex-col items-center animate-bounce z-20">
                  <div className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-black shadow-lg whitespace-nowrap">
                    {item.amount || `$${item.value * 500}`}
                  </div>
                  {/* Tooltip dot */}
                  <div className="w-2 h-2 bg-slate-900 dark:bg-white rotate-45 -mt-1" />
                </div>
              )}

              {/* Bar Capsule Element */}
              <div className="w-full flex items-end justify-center h-40 pb-2">
                <div 
                  className={`w-full max-w-[42px] rounded-full transition-all duration-500 relative ${
                    isSelected
                      ? 'bg-gradient-to-t from-blue-600 via-blue-400 to-indigo-300 shadow-blue-glow scale-105'
                      : 'bg-white/60 dark:bg-slate-800/80 border border-white/80 dark:border-white/5 group-hover:bg-white/90 dark:group-hover:bg-slate-700/80'
                  } ${item.height}`}
                >
                  {/* Top Highlight Dot for Active Bar */}
                  {isSelected && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md animate-pulse" />
                  )}
                </div>
              </div>

              {/* Month Label */}
              <span className={`text-[11px] font-bold tracking-wider mt-2 transition-colors ${
                isSelected 
                  ? 'text-slate-900 dark:text-white font-extrabold' 
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              }`}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
