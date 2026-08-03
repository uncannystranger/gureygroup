import React, { useState } from 'react';
import { Users, Shield, Plus, Mail, CheckCircle2, Activity, UserPlus } from 'lucide-react';

export default function TeamScreen() {
  const members = [
    { id: 1, name: 'Fernando Alonso', role: 'Chief Executive & Founder', email: 'fernando@gureygroup.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', badge: 'Owner' },
    { id: 2, name: 'Charles Leclerc', role: 'Head of Quantitative Systems', email: 'charles@gureygroup.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', badge: 'Admin' },
    { id: 3, name: 'Maya Naira', role: 'Principal UI/UX Architect', email: 'maya@gureygroup.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', badge: 'Editor' },
    { id: 4, name: 'Elena Rostova', role: 'Treasury & Compliance Lead', email: 'elena@gureygroup.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', badge: 'Compliance' },
  ];

  const activities = [
    { time: '10 mins ago', text: 'Fernando A. authorized $1,200 payment to Stripe Pricing' },
    { time: '1 hour ago', text: 'Charles L. modified automated treasury rebalancing threshold' },
    { time: '3 hours ago', text: 'Maya N. updated Liquid Glass UI design system tokens' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Team & Permissions
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage workspace access controls, roles, and real-time audit log
          </p>
        </div>

        <button 
          onClick={() => alert('Invite Team Member Dialog Opened')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Team Members List */}
        <div className="lg:col-span-8 glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            Active Members ({members.length})
          </h3>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all">
                <div className="flex items-center space-x-3.5">
                  <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {m.name}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                        {m.badge}
                      </span>
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400">{m.role} • {m.email}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300">
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Audit Stream */}
        <div className="lg:col-span-4 glass-panel rounded-4xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-500" /> Audit Log Stream
            </h3>

            <div className="space-y-4">
              {activities.map((act, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-indigo-500/40 text-xs">
                  <span className="text-[10px] font-bold text-indigo-500">{act.time}</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{act.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
