import React, { useState } from 'react';
import { Shield, UserPlus, Activity, Users as UsersIcon } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function EmployeesScreen() {
  const { employees, activities } = useMultiTenant();
  const { t, formatDate } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('employees');

  const usersSubTabs = [
    { id: 'employees', labelKey: 'nav.employees', defaultLabel: 'Employees Directory', icon: UsersIcon },
    { id: 'roles', labelKey: 'employees.role', defaultLabel: 'Roles & Permissions', icon: Shield },
    { id: 'activity', labelKey: 'dashboard.recent_activity', defaultLabel: 'Activity Logs Stream', icon: Activity },
  ];

  return (
    <div className="space-y-6 pb-12 page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('employees.title', 'User & Employee Directory')}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('employees.subtitle', 'Manage team access, security permissions, and operational roles.')}
          </p>
        </div>

        <button 
          onClick={() => alert(t('employees.add_employee', 'Invite Employee Dialog'))}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto btn-micro"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('employees.add_employee', 'Add Team Member')}</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs for Users Section */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl glass-panel border border-white/60 dark:border-white/10">
        {usersSubTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all btn-micro ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{t(tab.labelKey, tab.defaultLabel)}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Employees Directory */}
      {activeSubTab === 'employees' && (
        <div className="glass-panel rounded-4xl p-6 card-hover-lift">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            {t('nav.employees', 'Active Staff Members')} ({employees.length})
          </h3>

          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all animate-fade-in-up">
                <div className="flex items-center space-x-3.5">
                  <img src={emp.avatar} alt={emp.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {emp.name}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                        {t(`status.${emp.badge.toLowerCase()}`, emp.badge)}
                      </span>
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400">{emp.role} • {emp.email}</p>
                  </div>
                </div>
                <button onClick={() => alert(`Edit role for ${emp.name}`)} className="px-3.5 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 btn-micro">
                  {t('common.edit', 'Edit Role')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Roles & Permissions */}
      {activeSubTab === 'roles' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Role-Based Access Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { role: 'Owner / Superadmin', count: '1 User', perm: 'Full Access (Billing, API, Users, Inventory)' },
              { role: 'Store Manager', count: '1 User', perm: 'Inventory, Sales, POs, Staff Audit' },
              { role: 'Head Cashier', count: '1 User', perm: 'POS Checkout, Refunds, Customer Directory' },
              { role: 'Inventory Staff', count: '1 User', perm: 'Stock Intake, Barcode Scanning, Expiries' },
            ].map((r) => (
              <div key={r.role} className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 card-hover-lift animate-fade-in-up">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-indigo-500">{r.role}</span>
                  <span className="text-[10px] font-bold text-slate-400">{r.count}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{r.perm}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Activity Logs */}
      {activeSubTab === 'activity' && (
        <div className="glass-panel rounded-4xl p-6 card-hover-lift">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-indigo-500" /> Real-time Activity Timeline Audit
          </h3>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-4 border-l-2 border-indigo-500/40 text-xs animate-fade-in-up">
                <span className="text-[10px] font-bold text-indigo-500">{formatDate(act.time)} • {act.user}</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{act.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
