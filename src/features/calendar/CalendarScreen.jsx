import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Truck, AlertTriangle, UserCheck, Plus } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

export default function CalendarScreen() {
  const { purchaseOrders, products } = useMultiTenant();

  const events = [
    { id: 1, date: 'Aug 05, 2026', time: '10:00 AM', title: 'Supplier Restock Delivery (PO-2026-003)', type: 'PO', icon: Truck, color: 'bg-blue-500 text-white' },
    { id: 2, date: 'Aug 08, 2026', time: '02:00 PM', title: 'Luxe Cosmetics Batch PO-2026-004 Arrival', type: 'PO', icon: Truck, color: 'bg-indigo-500 text-white' },
    { id: 3, date: 'Aug 15, 2026', time: 'All Day', title: 'Product Expiry Threshold Audit (Batch BT-2025-12K)', type: 'Expiry', icon: AlertTriangle, color: 'bg-amber-500 text-white' },
    { id: 4, date: 'Aug 20, 2026', time: '09:00 AM', title: 'Morning Shift: Ahmed Cashier & Fatima Manager', type: 'Shift', icon: UserCheck, color: 'bg-emerald-500 text-white' }
  ];

  return (
    <div className="space-y-6 pb-12 page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Calendar & Event Scheduler
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Track supplier deliveries, product expirations, employee shifts, and automated report runs
          </p>
        </div>

        <button 
          onClick={() => alert('New Event Dialog')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event / Shift</span>
        </button>
      </div>

      {/* Calendar Grid & Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scheduled Events List (7 Columns) */}
        <div className="lg:col-span-7 glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" /> Upcoming Schedule & Deliveries
          </h3>

          <div className="space-y-3">
            {events.map((ev) => {
              const Icon = ev.icon;
              return (
                <div key={ev.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5">
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-10 h-10 rounded-2xl ${ev.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-400">{ev.date} • {ev.time}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ev.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Visual Matrix Simulation (5 Columns) */}
        <div className="lg:col-span-5 glass-panel rounded-4xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
              August 2026 Overview
            </h3>

            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div 
                  key={day} 
                  className={`p-2 rounded-xl border transition-all ${
                    day === 3 || day === 5 || day === 8 
                      ? 'bg-indigo-500 text-white font-black shadow-md' 
                      : 'border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/50'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
