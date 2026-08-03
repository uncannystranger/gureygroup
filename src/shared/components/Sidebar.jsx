import React, { useEffect } from 'react';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  FileText, 
  Users,
  Clock,
  GitBranch,
  Activity,
  Monitor,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../core/theme/ThemeContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const { activePreset } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { id: 'general', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', icon: Building2 },
    { id: 'products', labelKey: 'nav.products', defaultLabel: 'Products', icon: Package },
    { id: 'sales', labelKey: 'nav.sales', defaultLabel: 'Sales', icon: ShoppingCart },
    { id: 'reports', labelKey: 'nav.reports', defaultLabel: 'Reports', icon: FileText },
    { id: 'users', labelKey: 'nav.users', defaultLabel: 'Team', icon: Users },
    { id: 'attendance', labelKey: 'nav.attendance', defaultLabel: 'Attendance', icon: Clock },
    { id: 'branches', labelKey: 'nav.branches', defaultLabel: 'Branches', icon: GitBranch },
    { id: 'audit', labelKey: 'nav.audit', defaultLabel: 'Audit', icon: Activity },
    { id: 'sessions', labelKey: 'nav.sessions', defaultLabel: 'Sessions', icon: Monitor },
    { id: 'settings', labelKey: 'nav.settings', defaultLabel: 'Settings', icon: Settings },
  ];

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const handleSelect = (id) => {
    setActiveTab(id);
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* -------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (lg and up)                       */}
      {/* -------------------------------------------------- */}
      <aside className="hidden lg:flex w-20 md:w-22 flex-col items-center justify-start pt-8 pb-6 px-3 glass-panel rounded-4xl my-4 ml-4 shadow-glass-light dark:shadow-glass-dark border border-white/60 dark:border-white/10 z-30 transition-all duration-200 shrink-0">
        <nav className="flex flex-col space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t(item.labelKey, item.defaultLabel);
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSelect(item.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center btn-micro ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/15 hover:text-slate-900 dark:hover:text-white hover:shadow-xs'
                  }`}
                  aria-label={label}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-150 ease-out ${isActive ? 'scale-110' : 'group-hover:scale-[1.06]'}`} />
                </button>
                
                {/* Active Indicator glow bar */}
                {isActive && (
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 ${activePreset.bgClass} rounded-r-full ${activePreset.glow} transition-all duration-200 ease-out`} />
                )}

                {/* Floating Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 pointer-events-none whitespace-nowrap shadow-xl z-50">
                  {label}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* -------------------------------------------------- */}
      {/* MOBILE BACKDROP & OVERLAY DRAWER (< lg)            */}
      {/* -------------------------------------------------- */}
      <div 
        className={`sidebar-backdrop lg:hidden ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] glass-panel bg-white/95 dark:bg-slate-900/95 border-r border-white/60 dark:border-white/10 z-50 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl capsule-mesh-gradient flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Gurey Group</h2>
                <p className="text-[10px] text-slate-400 font-semibold">Enterprise Workspace</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Nav Items */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = t(item.labelKey, item.defaultLabel);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400 dark:text-indigo-600' : ''}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-[10px] font-semibold text-slate-400 text-center">
          Gurey Group &copy; 2026
        </div>
      </aside>
    </>
  );
}

