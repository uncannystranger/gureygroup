import React, { useState, useEffect } from 'react';
import { Search, Command, ArrowRight, PieChart, Users, Briefcase, BarChart3, Settings, CreditCard } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, setActiveTab }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'overview', title: 'Financial Overview', category: 'Navigation', icon: PieChart },
    { id: 'analytics', title: 'Analytics & Insights', category: 'Navigation', icon: BarChart3 },
    { id: 'projects', title: 'Projects & Funding', category: 'Navigation', icon: Briefcase },
    { id: 'team', title: 'Team & Activity', category: 'Navigation', icon: Users },
    { id: 'settings', title: 'Settings & Design System', category: 'Navigation', icon: Settings },
    { id: 'transfer', title: 'Send Money to Contact', category: 'Action', icon: CreditCard },
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id) => {
    if (id !== 'transfer') {
      setActiveTab(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-4 shadow-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-3 py-2 border-b border-slate-200/60 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Action Results */}
        <div className="mt-3 max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
