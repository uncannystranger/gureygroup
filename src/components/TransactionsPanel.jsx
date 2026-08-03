import React, { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, HelpCircle, ExternalLink } from 'lucide-react';

export default function TransactionsPanel({ onViewAll }) {
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = [
    { id: 1, name: 'YouTube', type: 'out', date: 'Jun 15', status: 'Pending', statusColor: 'bg-blue-500 text-white', amount: '-$50' },
    { id: 2, name: 'John Doe', type: 'out', date: 'Jun 14', status: 'Done', statusColor: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300', amount: '-$100' },
    { id: 3, name: 'Sans Brothers', type: 'in', date: 'Jun 13', status: 'Done', statusColor: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300', amount: '+$120' },
    { id: 4, name: 'John Doe', type: 'out', date: 'Jun 8', status: 'Done', statusColor: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300', amount: '-$100' },
    { id: 5, name: 'Cinema City', type: 'out', date: 'Jun 6', status: 'Done', statusColor: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300', amount: '-$75' },
    { id: 6, name: 'To USD', type: 'out', date: 'Jun 1', status: 'Done', statusColor: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300', amount: '-$250' },
  ];

  const filtered = transactions.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* Transactions Section Card */}
      <div className="glass-panel rounded-4xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transactions
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Latest transfers
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={onViewAll}
              className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md hover:scale-105 transition-all"
            >
              View All
            </button>
          </div>
        </div>

        {/* Transactions Item List */}
        <div className="mt-5 space-y-3">
          {filtered.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer"
            >
              
              {/* Icon & Name */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  {item.type === 'in' ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500 group-hover:text-white" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {item.date}
                  </span>
                </div>
              </div>

              {/* Status Badge & Amount */}
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.statusColor}`}>
                  {item.status}
                </span>
                <span className={`text-xs font-extrabold ${item.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {item.amount}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Financial Savings Tip Card (from Reference Image) */}
      <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50">
        <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 tracking-tight">
          How to reduce expenses by 25%?
        </h4>
        <p className="text-xs font-medium text-indigo-800/80 dark:text-indigo-300/80 mt-1">
          View these useful tips to save your money.
        </p>
        <button 
          onClick={() => alert('Expense Reduction Tip: Consolidate unused API subscriptions and automate scheduled payments.')}
          className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-200 mt-2 inline-flex items-center gap-1"
        >
          Learn more <ExternalLink className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
