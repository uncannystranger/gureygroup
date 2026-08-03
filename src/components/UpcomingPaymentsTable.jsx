import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock, MoreHorizontal } from 'lucide-react';

export default function UpcomingPaymentsTable({ onViewAll }) {
  const payments = [
    {
      id: 1,
      name: 'Stripe Pricing',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg',
      fallbackIcon: 'S',
      date: 'Today',
      isToday: true,
      category: 'Payment Links',
      amount: '$1,200',
    },
    {
      id: 2,
      name: 'FigJam Membership',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
      fallbackIcon: 'F',
      date: 'Jun 23',
      isToday: false,
      category: 'Professional Plan',
      amount: '$155',
    },
    {
      id: 3,
      name: 'Loom Subscription',
      logo: 'https://raw.githubusercontent.com/feathericons/feather/master/icons/video.svg',
      fallbackIcon: 'L',
      date: 'Jul 15',
      isToday: false,
      category: 'Loom Business',
      amount: '$100',
    },
  ];

  return (
    <div className="glass-panel rounded-4xl p-6 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            Upcoming payments
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Automated recurring bills
          </p>
        </div>

        <button 
          onClick={onViewAll}
          className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          View All
        </button>
      </div>

      {/* Payments List / Table Rows */}
      <div className="space-y-3">
        {payments.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-200 group shadow-sm"
          >
            
            {/* Logo + Name */}
            <div className="flex items-center space-x-3.5 min-w-[180px]">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 p-2 border border-slate-200/60 dark:border-slate-600/50 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <img 
                  src={item.logo} 
                  alt={item.name} 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://raw.githubusercontent.com/feathericons/feather/master/icons/credit-card.svg';
                  }}
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
                  Auto-debit active
                </p>
              </div>
            </div>

            {/* Date Badge */}
            <div>
              {item.isToday ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500 text-white shadow-sm shadow-blue-500/30 animate-pulse">
                  Today
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.date}
                </span>
              )}
            </div>

            {/* Category Column */}
            <div className="hidden md:block text-xs font-medium text-slate-600 dark:text-slate-300">
              {item.category}
            </div>

            {/* Amount & Actions */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {item.amount}
              </span>
              <button 
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
