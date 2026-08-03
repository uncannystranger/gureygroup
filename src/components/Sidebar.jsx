import React from 'react';
import { 
  PieChart, 
  Users, 
  Briefcase, 
  Code2, 
  Settings, 
  Bell, 
  Sun, 
  Moon, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode, accentColor }) {
  const navItems = [
    { id: 'overview', label: 'Financial Overview', icon: PieChart },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'projects', label: 'Projects & Funding', icon: Briefcase },
    { id: 'team', label: 'Team & Activity', icon: Users },
    { id: 'settings', label: 'Settings & Tokens', icon: Settings },
  ];

  return (
    <aside className="w-20 md:w-22 flex flex-col items-center justify-between py-6 px-3 glass-panel rounded-4xl my-4 ml-4 shadow-glass-light dark:shadow-glass-dark border border-white/60 dark:border-white/10 z-30 transition-all duration-300">
      
      {/* Top Logo */}
      <div className="flex flex-col items-center space-y-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 dark:from-indigo-600 dark:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all group relative"
        >
          <span className="text-2xl font-black tracking-tighter">f</span>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Gurey Group
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col space-y-3.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </button>
                
                {/* Active side indicator glow bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366F1]" />
                )}

                {/* Floating Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50 transform translate-x-1 group-hover:translate-x-0">
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls & Profile */}
      <div className="flex flex-col items-center space-y-4">
        
        {/* Dark / Light Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-11 h-11 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/15 transition-all shadow-sm group relative"
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700" />
          )}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50">
            {darkMode ? 'Light Theme' : 'Dark Theme'}
          </div>
        </button>

        {/* Notifications */}
        <button className="w-11 h-11 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/15 transition-all shadow-sm relative group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50">
            Notifications (3)
          </div>
        </button>

        {/* User Profile Avatar */}
        <div className="pt-2">
          <button className="relative group p-0.5 rounded-full border-2 border-indigo-500/40 hover:border-indigo-500 transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
              alt="Fernando Alonso" 
              className="w-10 h-10 rounded-full object-cover shadow-md"
            />
            <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50">
              F. Alonso (Pro Tier)
            </div>
          </button>
        </div>

      </div>

    </aside>
  );
}
