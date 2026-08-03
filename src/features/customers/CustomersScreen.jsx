import React, { useState } from 'react';
import { Users, Award, Star, Phone, Mail, DollarSign, Plus, Gift, CreditCard } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

export default function CustomersScreen() {
  const { customers } = useMultiTenant();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Customers & Loyalty Rewards Program
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Customer groups, reward point balances, purchase history & credit ledgers
          </p>
        </div>

        <button 
          onClick={() => alert('New Customer Registration Dialog')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((cust) => (
          <div key={cust.id} className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  {cust.group}
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Award className="w-4 h-4" /> {cust.loyaltyPoints} Loyalty Points
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {cust.name}
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}</p>
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {cust.email}</p>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Total Spent</span>
                  <p className="font-black text-slate-900 dark:text-white">{cust.totalSpent}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">Last Purchase</span>
                  <p className="font-bold text-indigo-500">{cust.lastPurchase}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <button className="text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-colors">
                View Invoices & Receipts
              </button>
              <button className="px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[11px] font-bold">
                Redeem Points
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
