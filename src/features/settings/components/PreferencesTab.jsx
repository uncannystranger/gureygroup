import React, { useState } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Globe, 
  Calendar, 
  Clock, 
  DollarSign, 
  Bell, 
  Mail, 
  Smartphone, 
  Check, 
  Save, 
  Loader2 
} from 'lucide-react';
import { useUserProfile } from '../../../core/user/UserProfileContext';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useLanguage } from '../../../localization/LanguageContext';

export default function PreferencesTab() {
  const { profile, saveProfile } = useUserProfile();
  const { themeMode, setThemeMode, accentColor, setAccentColor, themePresets } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [formState, setFormState] = useState({
    theme: themeMode || profile.theme || 'system',
    language: language === 'so' ? 'Somali 🇸🇴' : 'English 🇬🇧',
    dateFormat: profile.dateFormat || 'MM/DD/YYYY',
    timeFormat: profile.timeFormat || '12-hour',
    currency: profile.currency || 'USD ($)',
    emailNotifications: profile.emailNotifications !== undefined ? profile.emailNotifications : true,
    browserNotifications: profile.browserNotifications !== undefined ? profile.browserNotifications : true,
  });

  const [initialState] = useState({ ...formState });
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState) || themeMode !== formState.theme;

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (field === 'theme') {
      setThemeMode(value);
    }
    if (field === 'language') {
      if (value.includes('Somali') || value === 'so') {
        setLanguage('so');
      } else {
        setLanguage('en');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    await saveProfile(formState);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Theme Preference */}
      <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" /> {t('settings.preferences_tab', 'System Appearance & Mode')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'system', name: 'System Preference', icon: Monitor, desc: 'Auto-detect OS theme' },
            { id: 'light', name: 'Light Mode', icon: Sun, desc: 'Clean slate light canvas' },
            { id: 'dark', name: 'Dark Mode', icon: Moon, desc: 'Obsidian dark canvas' },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = formState.theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleChange('theme', mode.id)}
                className={`p-4 rounded-3xl border text-left flex flex-col justify-between h-28 transition-all btn-micro ${
                  isSelected 
                    ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]' 
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-indigo-500" />
                  {isSelected && <Check className="w-4 h-4 text-indigo-500 font-bold" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{mode.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{mode.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color Palette */}
      <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" /> Brand Accent Color
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themePresets.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => setAccentColor(acc.id)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all btn-micro ${
                accentColor === acc.id 
                  ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-indigo-500/30' 
                  : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 hover:bg-white/70'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`w-4 h-4 rounded-full ${acc.bgClass}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{acc.hex}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Regional & Formatting Preferences */}
      <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> Regional & Display Formats
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-500" /> {t('settings.preferred_language', 'Interface Language')}
            </label>
            <select
              value={formState.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="English 🇬🇧">English 🇬🇧</option>
              <option value="Somali 🇸🇴">Somali 🇸🇴</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-indigo-500" /> Currency Symbol & Standard
            </label>
            <select
              value={formState.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
              <option value="KES (KSh)">KES (KSh)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-500" /> Date Display Format
            </label>
            <select
              value={formState.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (08/03/2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (03/08/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-03)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" /> Time Display Standard
            </label>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {['12-hour', '24-hour'].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleChange('timeFormat', tf)}
                  className={`py-2 rounded-2xl border text-center text-xs font-bold transition-all btn-micro ${
                    formState.timeFormat === tf 
                      ? 'border-indigo-500 bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {tf === '12-hour' ? '12 Hour (1:30 PM)' : '24 Hour (13:30)'}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" /> Notification Channels
        </h3>

        <div className="space-y-3 text-xs">
          
          <div className="flex items-center justify-between p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white">Email Alerts & Summaries</h4>
                <p className="text-[11px] text-slate-400">Receive daily sales summaries, low stock warnings, and security notices.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleChange('emailNotifications', !formState.emailNotifications)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                formState.emailNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                formState.emailNotifications ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white">Browser Push Notifications</h4>
                <p className="text-[11px] text-slate-400">Real-time web browser alerts when new POS orders or sales complete.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleChange('browserNotifications', !formState.browserNotifications)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                formState.browserNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                formState.browserNotifications ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-2 btn-micro"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Save className="w-4 h-4" />}
          <span>{t('common.save', 'Save Changes')}</span>
        </button>
      </div>

    </form>
  );
}
