import React, { useState } from 'react';
import { Warehouse, ArrowRightLeft, AlertTriangle, Layers, Plus, PackageCheck } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

export default function WarehousesScreen() {
  const { warehouses, products, activeCompany } = useMultiTenant();
  const [activeTab, setActiveTab] = useState('warehouses');

  return (
    <div className="space-y-6 pb-12 page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Warehouse & Inventory Transfers
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Central depot storage, branch stock transfers, receiving manifests & damaged goods
          </p>
        </div>

        <button 
          onClick={() => alert('Initiate Branch Stock Transfer Form')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* Warehouses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div key={wh.id} className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                  {wh.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                  Operational
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-500" /> {wh.name}
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">{wh.location}</p>

              <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Depot Manager</span>
                  <p className="font-bold text-slate-900 dark:text-white">{wh.manager}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">Capacity</span>
                  <p className="font-bold text-indigo-500">{wh.capacity}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Active Transfers: 2</span>
              <button className="text-indigo-600 dark:text-indigo-400 underline">View Manifest</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
