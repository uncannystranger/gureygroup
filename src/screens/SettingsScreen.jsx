import React from 'react';
import { Settings, Sliders, Palette, Layers, Check, Sparkles, Sun, Moon, CreditCard, ArrowUpRight } from 'lucide-react';

export default function SettingsScreen({ darkMode, setDarkMode, accentColor, setAccentColor }) {
  const accents = [
    { id: 'blue', name: 'Electric Blue', hex: '#3B82F6', class: 'bg-blue-500' },
    { id: 'indigo', name: 'Soft Indigo', hex: '#6366F1', class: 'bg-indigo-500' },
    { id: 'purple', name: 'Royal Purple', hex: '#8B5CF6', class: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Design System Inspector
        </h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Live design system tokens, liquid glass parameters, and theme controls
        </p>
      </div>

      {/* Theme & Accent Controls Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appearance & Mode Toggle */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Color Mode
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Toggle complete Light and Dark theme modes (solid background canvas with component liquid glass).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDarkMode(false)}
              className={`p-4 rounded-3xl border text-left flex flex-col justify-between h-28 transition-all ${
                !darkMode 
                  ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-500/30' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun className="w-5 h-5 text-amber-500" />
                {!darkMode && <Check className="w-4 h-4 text-indigo-500" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</span>
                <p className="text-[10px] text-slate-400">Clean Slate Slate (#EBF0F7)</p>
              </div>
            </button>

            <button
              onClick={() => setDarkMode(true)}
              className={`p-4 rounded-3xl border text-left flex flex-col justify-between h-28 transition-all ${
                darkMode 
                  ? 'border-indigo-500 bg-slate-900 shadow-md ring-2 ring-indigo-500/30' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon className="w-5 h-5 text-indigo-400" />
                {darkMode && <Check className="w-4 h-4 text-indigo-400" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white">Dark Mode</span>
                <p className="text-[10px] text-slate-400">Obsidian Midnight (#0B0F17)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Accent Color Selection */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Accent Palette
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select primary accent color token applied across glowing nodes and highlights.
          </p>

          <div className="space-y-3">
            {accents.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setAccentColor(acc.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  accentColor === acc.id 
                    ? 'border-indigo-500 bg-white/80 dark:bg-slate-800/80 shadow-sm' 
                    : 'border-transparent hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-5 h-5 rounded-full ${acc.class} shadow-sm`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{acc.hex}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Design System Token Showcase */}
      <div className="glass-panel rounded-4xl p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Design System Components & Tokens Playground
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive preview of shared design system primitives
          </p>
        </div>

        {/* Buttons Showcase */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
            Pill Buttons & Variants
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md">
              Primary Filled
            </button>
            <button className="px-5 py-2.5 rounded-full glass-pill text-slate-800 dark:text-white font-bold text-xs">
              Glass Outline
            </button>
            <button className="px-5 py-2.5 rounded-full bg-indigo-500 text-white font-bold text-xs shadow-pill-glow">
              Glowing Accent Node
            </button>
            <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[11px] font-extrabold">
              Badge Status
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold">
              +14.2% Growth
            </span>
          </div>
        </div>

        {/* Corner Radii System */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
            Corner Radii Hierarchy
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              rounded-2xl (16px)
            </div>
            <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              rounded-3xl (24px)
            </div>
            <div className="p-4 rounded-4xl bg-white/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              rounded-4xl (32px)
            </div>
            <div className="p-4 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              rounded-full (Pill)
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
