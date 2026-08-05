import React, { useState, useEffect } from 'react';
import { 
  User, 
  Sliders, 
  Lock, 
  Building2, 
  CreditCard, 
  Database, 
  Plug, 
  Download,
  Smartphone,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import EditProfileTab from './components/EditProfileTab';
import PreferencesTab from './components/PreferencesTab';
import SecurityTab from './components/SecurityTab';

export default function SettingsScreen({ initialTab }) {
  const { activeCompany, activeCompanyId } = useMultiTenant();
  const { t } = useLanguage();

  const isProfilePage = initialTab === 'profile';
  const [activeGroup, setActiveGroup] = useState(() => {
    return isProfilePage ? 'profile' : 'preferences';
  });

  // Mobile Money merchant number — persisted to localStorage
  const [merchantNumber, setMerchantNumber] = useState(() => {
    try { return localStorage.getItem('gurey_merchant_number') || '615283292'; } catch { return '615283292'; }
  });
  const [merchantSaved, setMerchantSaved] = useState(false);

  const saveMerchantNumber = () => {
    try { localStorage.setItem('gurey_merchant_number', merchantNumber.trim()); } catch {}
    setMerchantSaved(true);
    setTimeout(() => setMerchantSaved(false), 2500);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveGroup(initialTab === 'profile' ? 'profile' : initialTab);
    }
  }, [initialTab]);

  const settingGroups = [
    { id: 'preferences', labelKey: 'settings.preferences_tab', defaultName: 'Preferences', icon: Sliders },
    { id: 'security', labelKey: 'settings.security_tab', defaultName: 'Security & Access', icon: Lock },
    { id: 'general', labelKey: 'settings.business_name', defaultName: 'Business Info', icon: Building2 },
    { id: 'billing', labelKey: 'nav.sales', defaultName: 'Billing & Plan', icon: CreditCard },
    { id: 'system', labelKey: 'nav.settings', defaultName: 'System & Backup', icon: Database },
    { id: 'advanced', labelKey: 'nav.reports', defaultName: 'Advanced API', icon: Plug },
  ];
  const visibleGroups = isProfilePage
    ? [{ id: 'profile', labelKey: 'header.edit_profile', defaultName: 'Edit Profile', icon: User }]
    : settingGroups;

  return (
    <div className="space-y-6 pb-12 page-enter">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('settings.title', 'System & Store Settings')}
        </h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {isProfilePage
            ? t('settings.profile_subtitle', 'Manage personal profile details only.')
            : t('settings.subtitle', 'Configure theme, notifications, security, billing, subscription, organization, and system settings.')}
        </p>
      </div>

      {/* Logical Groups Nav Bar */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2 rounded-3xl glass-panel border border-white/60 dark:border-white/10">
        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const isActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all btn-micro ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(group.labelKey, group.defaultName)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      {activeGroup === 'profile' && <EditProfileTab />}

      {activeGroup === 'preferences' && <PreferencesTab />}

      {activeGroup === 'security' && <SecurityTab />}

      {/* Group: General Business Information */}
      {activeGroup === 'general' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" /> Business Information & Store Branding
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.business_name', 'Company / Store Name')}</label>
                <input
                  type="text"
                  defaultValue={activeCompany?.name}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Store Currency</label>
                <input
                  type="text"
                  defaultValue={`${activeCompany?.currency} (${activeCompany?.currencySymbol})`}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('settings.time_zone', 'Timezone')}</label>
                <input
                  type="text"
                  defaultValue={activeCompany?.timezone}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('common.tax', 'Tax Rate (%)')}</label>
                <input
                  type="text"
                  defaultValue={`${activeCompany?.taxRate}%`}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group: Billing */}
      {activeGroup === 'billing' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Subscription & Usage Limits
          </h3>
          <p className="text-xs text-slate-400">Current Plan: <span className="font-black text-indigo-500">Professional Tier ($79/mo)</span></p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {['Starter ($29/mo)', 'Professional ($79/mo)', 'Enterprise (Custom)'].map((p) => (
              <div key={p} className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40 text-xs font-bold text-slate-900 dark:text-white flex justify-between items-center card-hover-lift">
                <span>{p}</span>
                <button className="px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] btn-micro">Upgrade</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group: System */}
      {activeGroup === 'system' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" /> Taxes, Backups & Storage Architecture
          </h3>

          <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/50 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
            <p>✓ Default Sales Tax Rate: {activeCompany?.taxRate}%</p>
            <p>✓ Multi-Tenant Isolation ID: {activeCompanyId}</p>
            <p>✓ Firestore Storage Collections Scoped</p>
          </div>

          <button 
            onClick={() => alert('Full JSON Database Snapshot Exported')}
            className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md flex items-center gap-2 btn-micro"
          >
            <Download className="w-4 h-4" /> Download Backup JSON
          </button>
        </div>
      )}

      {/* Group: Advanced */}
      {activeGroup === 'advanced' && (
        <div className="space-y-5">

          {/* Mobile Money / QR Payment Config */}
          <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" /> Mobile Money & QR Payment
            </h3>
            <p className="text-xs text-slate-400">
              Set your merchant number for EVC, Zaad, or Sahal. This number is embedded in every QR code generated at POS checkout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Merchant Number</label>
                <input
                  type="tel"
                  value={merchantNumber}
                  onChange={(e) => setMerchantNumber(e.target.value)}
                  placeholder="e.g. 615283292"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Used in USSD string: <code className="font-mono text-emerald-600 dark:text-emerald-400">*712*{merchantNumber || 'XXXXXXX'}*{'<amount>'}#</code></p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveMerchantNumber}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all hover:scale-[1.02] active:scale-[0.98] btn-micro ${
                    merchantSaved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{merchantSaved ? 'Saved!' : 'Save Merchant Number'}</span>
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Preview USSD Code</p>
              <p className="font-mono text-sm font-black text-slate-900 dark:text-white">*712*{merchantNumber || 'XXXXXXX'}*[AMOUNT]#</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">This is what gets encoded into the QR code at checkout.</p>
            </div>
          </div>

          {/* Developer API */}
          <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Plug className="w-4 h-4 text-indigo-500" /> Developer API & Hardware Integrations
            </h3>
            <p className="text-xs text-slate-400">Configure Stripe, Square Terminal, Mobile Money, and Thermal Printers.</p>
            
            <div className="p-4 rounded-3xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono">
              API Secret Key: <span className="text-indigo-500">vk_live_8901239849201948</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
