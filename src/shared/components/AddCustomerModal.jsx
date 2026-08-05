import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import Modal from './Modal';

export default function AddCustomerModal({ isOpen, onClose, onCustomerAdded }) {
  const { addCustomer } = useMultiTenant();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('VIP Member');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust = addCustomer({ name, phone, email, group });
    if (onCustomerAdded) onCustomerAdded(newCust);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employees.add_employee', 'Add New Customer')} className="max-w-3xl">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t('employees.add_employee', 'Add New Customer')}</h3>
            <p className="text-xs font-semibold text-slate-500">Register customer for loyalty rewards</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs font-semibold">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('employees.name', 'Full Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('employees.phone', 'Phone Number')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('employees.email', 'Email Address')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Membership Tier</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              <option value="VIP Member">VIP Member</option>
              <option value="Regular Retail">Regular Retail</option>
              <option value="Wholesale Client">Wholesale Client</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold btn-micro"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black shadow-md hover:scale-105 transition-all btn-micro"
            >
              {t('common.save', 'Save Customer')}
            </button>
          </div>
        </form>

      </div>
    </Modal>
  );
}
