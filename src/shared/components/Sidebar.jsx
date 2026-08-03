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
  Sparkles,
  Sun,
  Moon,
  LogOut,
  User,
  Check
} from 'lucide-react';
import { useTheme } from '../../core/theme/ThemeContext';
import { useLanguage } from '../../localization/LanguageContext';
import { useUserProfile } from '../../core/user/UserProfileContext';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useAuth } from '../../core/auth/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const { activePreset, darkMode, setThemeMode, themeMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { profile } = useUserProfile();
  const { branches, activeBranchId, setActiveBranchId } = useMultiTenant();
  const { logout } = useAuth();

  const navItems = [
    { id: 'general', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', icon: Building2 },
    { id: 'sales', labelKey: 'nav.sales', defaultLabel: 'POS Terminal', icon: ShoppingCart },
    { id: 'products', labelKey: 'nav.products', defaultLabel: 'Products & Inventory', icon: Package },
    { id: 'reports', labelKey: 'nav.reports', defaultLabel: 'Reports & Analytics', icon: FileText },
    { id: 'users', labelKey: 'nav.users', defaultLabel: 'Team & Employees', icon: Users },
    { id: 'attendance', labelKey: 'nav.attendance', defaultLabel: 'Attendance', icon: Clock },
    { id: 'branches', labelKey: 'nav.branches', defaultLabel: 'Branch Management', icon: GitBranch },
    { id: 'audit', labelKey: 'nav.audit', defaultLabel: 'Audit Logs', icon: Activity },
    { id: 'sessions', labelKey: 'nav.sessions', defaultLabel: 'Active Sessions', icon: Monitor },
    { id: 'settings', labelKey: 'nav.settings', defaultLabel: 'System Settings', icon: Settings },
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

  const handleToggleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
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

      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[88vw] glass-panel bg-white/95 dark:bg-slate-900/95 border-r border-white/60 dark:border-white/10 z-50 p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-4">
          {/* Drawer Header with App Brand & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl capsule-mesh-gradient flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">Gurey Group</h2>
                <p className="text-[10px] text-slate-400 font-medium">Enterprise SaaS</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img 
                src={profile.photo} 
                alt={profile.displayName} 
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-indigo-400/30"
              />
              <div className="truncate">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{profile.displayName}</h4>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  {profile.jobTitle || 'Owner'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSelect('profile')}
              className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-indigo-500 shadow-xs text-xs font-bold shrink-0"
              title="Edit Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Branch Selector Pill if multiple branches exist */}
          {branches.length > 0 && (
            <div className="px-1 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Active Branch</label>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Drawer Navigation Links */}
          <nav className="space-y-1 pt-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-1 mb-1">Navigation</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = t(item.labelKey, item.defaultLabel);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-[1.01]' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400 dark:text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Controls & Logout */}
        <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
          {/* Theme & Language Quick Switches */}
          <div className="flex items-center justify-between text-xs font-bold">
            <button
              onClick={handleToggleTheme}
              className="flex-1 mr-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {themeMode === 'system' ? <Monitor className="w-3.5 h-3.5 text-indigo-500" /> : darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span className="capitalize">{themeMode} Theme</span>
            </button>

            <button
              onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{language === 'en' ? '🇬🇧 EN' : '🇸🇴 SO'}</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => { setMobileOpen(false); logout(); }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center font-semibold">Gurey Group &copy; 2026</p>
        </div>
      </aside>
    </>
  );
}


