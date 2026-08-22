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
import { useRBAC } from '../../core/rbac/RBACContext';
import { PERMISSIONS } from '../../core/rbac/permissions';

export default function Sidebar({ activeTab, setActiveTab, onOpenProfile, mobileOpen, setMobileOpen }) {
  const { activePreset, darkMode, setThemeMode, themeMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { profile } = useUserProfile();
  const { branches, activeBranchId, setActiveBranchId, activeCompany } = useMultiTenant();
  const { logout, tenantCompany } = useAuth();
  const { hasPermission } = useRBAC();

  const currentCompany = activeCompany || tenantCompany;

  const navItems = [
    { id: 'general', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', icon: Building2 },
    { id: 'sales', labelKey: 'nav.sales', defaultLabel: 'POS Terminal', icon: ShoppingCart, permission: PERMISSIONS.SALES_VIEW },
    { id: 'products', labelKey: 'nav.products', defaultLabel: 'Products & Inventory', icon: Package, permission: PERMISSIONS.PRODUCTS_VIEW },
    { id: 'reports', labelKey: 'nav.reports', defaultLabel: 'Reports & Analytics', icon: FileText, permission: PERMISSIONS.REPORTS_VIEW },
    { id: 'users', labelKey: 'nav.users', defaultLabel: 'Team & Employees', icon: Users, permission: PERMISSIONS.TEAM_VIEW },
    { id: 'attendance', labelKey: 'nav.attendance', defaultLabel: 'Attendance', icon: Clock, permission: PERMISSIONS.ATTENDANCE_VIEW_OWN },
    { id: 'branches', labelKey: 'nav.branches', defaultLabel: 'Branch Management', icon: GitBranch, permission: PERMISSIONS.BRANCHES_VIEW_OWN },
    { id: 'audit', labelKey: 'nav.audit', defaultLabel: 'Audit Logs', icon: Activity, permission: PERMISSIONS.AUDIT_VIEW },
    { id: 'sessions', labelKey: 'nav.sessions', defaultLabel: 'Active Sessions', icon: Monitor, permission: PERMISSIONS.SESSIONS_VIEW },
  ].filter(item => !item.permission || hasPermission(item.permission));

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

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, [mobileOpen]);

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
      <aside className="hidden lg:flex w-20 flex-col items-center justify-between pt-5 pb-5 px-3 glass-panel rounded-3xl my-4 ml-4 z-30 shrink-0">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Brand mark — anchors the rail and gives the workspace an identity */}
          <span
            className="w-10 h-10 rounded-2xl capsule-mesh-gradient grid place-items-center shrink-0"
            title={currentCompany?.name || 'Gurey Group'}
          >
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </span>

          <nav aria-label="Primary" className="w-full">
            <ul className="flex flex-col items-center gap-1.5 list-none m-0 p-0">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const label = t(item.labelKey, item.defaultLabel);
                return (
                  <li key={item.id} className="relative group w-full flex justify-center ds-rise" style={{ '--ds-index': index }}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-[background-color,color,transform] duration-150 ${
                        isActive
                          ? 'bg-[var(--ds-accent)] text-white'
                          : 'text-[var(--ds-text-muted)] hover:bg-[var(--ds-accent-soft)] hover:text-[var(--ds-accent)] active:scale-95'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </button>

                    {/* Active rail marker slides between items rather than blinking */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-[var(--ds-accent)] transition-[height,opacity] duration-200 ease-out ${
                        isActive ? 'h-5 opacity-100' : 'h-1 opacity-0'
                      }`}
                    />

                    {/* Label appears on hover/keyboard focus only */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-[3.75rem] top-1/2 -translate-y-1/2 translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-[opacity,transform] duration-150 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ds-text-inverse)] bg-[var(--ds-surface-inverse)] shadow-[var(--ds-shadow-lg)] z-50"
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-1 w-full">
          <div className="relative group w-full flex justify-center">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="ds-icon-btn w-11 h-11 rounded-xl"
            >
              {themeMode === 'system'
                ? <Monitor className="w-[18px] h-[18px]" aria-hidden="true" />
                : darkMode
                  ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
                  : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
              <span className="sr-only">{`Theme: ${themeMode}. Switch theme`}</span>
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[3.75rem] top-1/2 -translate-y-1/2 translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-[opacity,transform] duration-150 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ds-text-inverse)] bg-[var(--ds-surface-inverse)] shadow-[var(--ds-shadow-lg)] z-50 capitalize"
            >
              {themeMode} theme
            </span>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------- */}
      {/* MOBILE BACKDROP & OVERLAY DRAWER (< lg)            */}
      {/* -------------------------------------------------- */}
      <div 
        className={`sidebar-backdrop lg:hidden ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside aria-hidden={!mobileOpen} className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[88vw] glass glass-strong rounded-r-3xl z-50 p-5 flex flex-col justify-between transition-transform duration-300 ease-out overflow-y-auto overscroll-contain ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-4">
          {/* Drawer Header with App Brand & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {currentCompany?.logo ? (
                <img src={currentCompany.logo} alt={currentCompany.name || 'Company logo'} className="w-9 h-9 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="w-9 h-9 rounded-2xl capsule-mesh-gradient flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight truncate">{currentCompany?.name || 'Workspace'}</h2>
                <p className="text-[10px] text-slate-400 font-medium">{currentCompany?.businessType || 'Business Workspace'}</p>
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
              onClick={() => { setMobileOpen(false); onOpenProfile?.(); }}
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
