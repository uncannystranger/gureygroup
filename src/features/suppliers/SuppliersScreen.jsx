import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, Mail, MapPin, DollarSign, FileText, ChevronRight } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

export default function SuppliersScreen() {
  const { suppliers, purchaseOrders } = useMultiTenant();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Suppliers & Purchase Orders
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage cosmetic vendors, lead times, credit balances, and restocking POs
          </p>
        </div>

        <button 
          onClick={() => alert('New Supplier Dialog Opened')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Supplier Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((sup) => (
          <div key={sup.id} className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                  {sup.creditTerms}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Verified Vendor
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {sup.companyName}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Contact: {sup.contactPerson}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {sup.phone}</p>
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {sup.email}</p>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {sup.address}</p>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Products Supplied</span>
                  <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{sup.productsSupplied}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">Payable Balance</span>
                  <p className="font-black text-rose-500">{sup.outstandingBalance}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <button className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                Create Purchase Order <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
