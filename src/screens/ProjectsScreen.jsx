import React, { useState } from 'react';
import { Briefcase, Plus, Users, Clock, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function ProjectsScreen() {
  const projects = [
    {
      id: 1,
      title: 'AI Portfolio Rebalancer',
      category: 'Fintech Protocol',
      budget: '$45,000',
      spent: '$28,400',
      progress: 63,
      status: 'In Progress',
      statusColor: 'bg-blue-500 text-white',
      lead: 'Fernando A.',
      leadAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      dueDate: 'Aug 24, 2026',
    },
    {
      id: 2,
      title: 'Stripe Treasury Integration',
      category: 'Infrastructure',
      budget: '$20,000',
      spent: '$19,200',
      progress: 96,
      status: 'Audit Phase',
      statusColor: 'bg-amber-500 text-white',
      lead: 'Charles L.',
      leadAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      dueDate: 'Aug 10, 2026',
    },
    {
      id: 3,
      title: 'Mobile App Liquid Glass UI v2',
      category: 'Design System',
      budget: '$35,000',
      spent: '$12,000',
      progress: 34,
      status: 'In Progress',
      statusColor: 'bg-blue-500 text-white',
      lead: 'Maya N.',
      leadAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      dueDate: 'Sept 15, 2026',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Projects & Funding Allocations
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Track capital deployment across product engineering & research initiatives
          </p>
        </div>

        <button 
          onClick={() => alert('New Project Allocation Form Opened')}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Initiative</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between group hover:scale-[1.01] transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-500">
                  {proj.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${proj.statusColor}`}>
                  {proj.status}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {proj.title}
              </h3>

              {/* Budget metrics */}
              <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Budget Spent</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{proj.spent} <span className="text-xs text-slate-400 font-medium">/ {proj.budget}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400">Completion</span>
                  <p className="text-sm font-black text-indigo-500">{proj.progress}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${proj.progress}%` }} />
              </div>
            </div>

            {/* Footer Lead & Due date */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <img src={proj.leadAvatar} alt={proj.lead} className="w-7 h-7 rounded-full object-cover" />
                <span className="text-slate-700 dark:text-slate-300">{proj.lead}</span>
              </div>
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3" /> {proj.dueDate}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
