import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Command, 
  Sun, 
  Moon, 
  Monitor,
  User, 
  Settings, 
  LogOut,
  Bell,
  CheckCheck,
  Trash2,
  Globe,
  Check,
  Menu
  ,Building2, ChevronDown, Users, Package, TrendingUp
} from 'lucide-react';
import { useTheme } from '../../core/theme/ThemeContext';
import { useUserProfile } from '../../core/user/UserProfileContext';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import { useAuth } from '../../core/auth/AuthContext';

export default function Header({ setActiveTab, onOpenSearch, onOpenProfile, currentTab, onToggleMobileNav }) {
  const { darkMode, setThemeMode, themeMode } = useTheme();
  const { profile, showToast } = useUserProfile();
  const { notifications, markAllNotificationsRead, clearNotifications, branches, activeBranch, activeBranchId, setActiveBranchId } = useMultiTenant();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const branchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(event.target)) setIsBranchOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getLocalizedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('header.greeting_morning', 'Good Morning');
    if (hour >= 12 && hour < 17) return t('header.greeting_afternoon', 'Good Afternoon');
    if (hour >= 17 && hour < 22) return t('header.greeting_evening', 'Good Evening');
    return t('header.greeting_night', 'Good Night');
  };

  const isDashboard = ['dashboard', 'overview', 'general', ''].includes(currentTab || 'general');

  return (
    <header className="w-full flex items-center justify-between pt-6 pb-4 px-2">
      {/* Brand Title / Personalized Dynamic Greeting + Mobile Hamburger Toggle */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-2xl glass-panel text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-white/15 transition-all shadow-sm btn-micro"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {isDashboard ? (
            <div>
              <h1 className="min-w-0 text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span className="truncate">{getLocalizedGreeting()}, {profile.firstName || 'Abdullahi'}</span>
              </h1>
              <p className="max-w-[38rem] text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {t('header.welcome_sub', "Welcome back. Here's what's happening in your business today.")}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile.businessName || 'Gurey Group'}
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Search Bar -> Theme Toggle -> Notifications -> Profile Picture Avatar */}
      <div className="flex shrink-0 items-center space-x-2 sm:space-x-3">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-3 px-4 py-2 rounded-2xl glass-panel text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium border border-white/60 dark:border-white/10 shadow-sm btn-micro"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">{t('common.search_placeholder', 'Search catalog, orders...')}</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {branches.length > 0 && (
          <div className="relative hidden md:block" ref={branchRef}>
            <button
              type="button"
              onClick={() => setIsBranchOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-panel border border-white/60 dark:border-white/10 shadow-sm text-left hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all btn-micro"
              aria-haspopup="listbox"
              aria-expanded={isBranchOpen}
            >
              <span className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-indigo-500" /></span>
              <span className="hidden lg:block max-w-[126px]">
                <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Branch</span>
                <span className="block truncate text-xs font-black text-slate-800 dark:text-white">{activeBranch?.name || 'Select branch'}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
            </button>
            {isBranchOpen && (
              <div className="absolute right-0 top-12 z-50 w-[330px] max-w-[calc(100vw-1.5rem)] p-2 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-2xl animate-dropdown">
                <div className="px-3 py-2 mb-1"><p className="text-xs font-black text-slate-900 dark:text-white">Your locations</p><p className="text-[10px] font-medium text-slate-400">Switching updates your whole workspace</p></div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {branches.map((branch) => {
                    const selected = branch.id === activeBranchId;
                    return <button key={branch.id} type="button" disabled={!branch.isActive} onClick={() => { setActiveBranchId(branch.id); setIsBranchOpen(false); }} className={`w-full p-3 rounded-2xl text-left transition-all ${selected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'} ${!branch.isActive ? 'opacity-45 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center justify-between gap-3"><span className="font-black text-xs truncate">{branch.name}</span><span className={`text-[9px] font-black uppercase ${selected ? 'text-indigo-100' : branch.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span></div>
                      <div className={`mt-2 grid grid-cols-3 gap-1 text-[10px] font-bold ${selected ? 'text-indigo-100' : 'text-slate-400'}`}><span className="flex items-center gap-1"><Users className="w-3 h-3" />{branch.employeeCount || 0}</span><span className="flex items-center gap-1"><Package className="w-3 h-3" />{branch.productCount || 0}</span><span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />${Number(branch.todaySales || 0).toLocaleString()}</span></div>
                    </button>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-white dark:hover:bg-white/15 transition-all shadow-xs relative btn-micro"
            title={t('header.notifications', 'Notifications')}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto glass-panel rounded-3xl p-3 shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 z-50 animate-dropdown text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-500" /> {t('header.notifications', 'Notifications')} ({unreadCount} {t('header.new_count', 'new')})
                </span>
                <div className="flex items-center space-x-1">
                  <button onClick={markAllNotificationsRead} className="p-1 text-slate-400 hover:text-indigo-500 transition-colors btn-micro" title={t('header.mark_all_read', 'Mark all read')}>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={clearNotifications} className="p-1 text-slate-400 hover:text-rose-500 transition-colors btn-micro" title={t('header.clear_all', 'Clear all')}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[11px] font-semibold text-slate-400">
                    {t('header.no_notifications', 'No new notifications.')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 rounded-2xl border text-[11px] transition-all animate-fade-in-up ${
                      !n.isRead ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                    }`}>
                      <h5 className="font-extrabold text-slate-900 dark:text-white">{n.title}</h5>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium leading-snug">{n.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block font-bold">{n.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light / System Theme Toggle (Desktop Only — on mobile it lives in navigation drawer) */}
        <button
          onClick={handleToggleTheme}
          className="hidden md:flex w-9 h-9 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 items-center justify-center hover:bg-white dark:hover:bg-white/15 transition-all shadow-xs btn-micro"
          title={`Theme Mode: ${themeMode}`}
          aria-label="Toggle Theme Mode"
        >
          {themeMode === 'system' ? (
            <Monitor className="w-4 h-4 text-indigo-500" />
          ) : darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Profile Picture Avatar & Dropdown (Desktop Only — on mobile it lives in navigation drawer) */}
        <div className="hidden md:block relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="relative p-0.5 rounded-full border-2 border-indigo-500/40 hover:border-indigo-500 hover:scale-105 transition-all block duration-200 shadow-sm hover:shadow-indigo-500/20 btn-micro"
            aria-label="User Menu"
          >
            <img 
              src={profile.photo} 
              alt={profile.displayName} 
              className="w-8 h-8 rounded-full object-cover shadow-sm"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-11 w-56 max-w-[calc(100vw-1.5rem)] glass-panel rounded-2xl p-2 shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 z-50 animate-dropdown text-xs font-bold space-y-1">
              <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-900 dark:text-white font-extrabold truncate">{profile.displayName}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{profile.email}</p>
              </div>

              <button
                onClick={() => { setIsProfileOpen(false); onOpenProfile?.(); }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors text-left btn-micro"
              >
                <User className="w-4 h-4 text-indigo-500" />
                <span>{t('header.edit_profile', 'Edit Profile')}</span>
              </button>
              
              <button
                onClick={() => { setIsProfileOpen(false); setActiveTab('settings'); }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors text-left btn-micro"
              >
                <Settings className="w-4 h-4 text-indigo-500" />
                <span>{t('header.settings', 'Settings')}</span>
              </button>

              {/* Language Selector inside Profile Menu */}
              <div className="pt-1.5 pb-1 px-1 border-t border-b border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-indigo-500" />
                  <span>{t('common.language', 'Language')}</span>
                </div>
                
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left btn-micro ${
                    language === 'en' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>🇬🇧</span>
                    <span>English</span>
                  </span>
                  {language === 'en' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>

                <button
                  onClick={() => setLanguage('so')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left btn-micro ${
                    language === 'so' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>🇸🇴</span>
                    <span>Somali</span>
                  </span>
                  {language === 'so' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </div>

              <button
                onClick={() => { setIsProfileOpen(false); logout(); }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors text-left btn-micro"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('header.logout', 'Logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
