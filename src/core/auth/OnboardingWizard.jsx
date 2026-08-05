import React, { useState } from 'react';
import { Sparkles, Building2, Globe, DollarSign, Clock, ShieldCheck, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingWizard({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'Gurey Group',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=150&q=80',
    businessType: 'Retail & Beauty Salon',
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    taxRate: '8.5',
    initialBranch: 'SoHo Flagship Store',
    employeeEmails: 'cashier@gureygroup.com, manager@gureygroup.com'
  });

  if (!isOpen) return null;

  const stepsCount = 9;

  const handleNext = () => {
    if (step < stepsCount) {
      setStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain glass-panel rounded-4xl p-6 sm:p-10 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90">
        
        {/* Top Header & Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Welcome to Gurey Group
            </span>
            <span className="text-xs font-extrabold text-slate-400">
              Step {step} of {stepsCount}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${(step / stepsCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="space-y-6 min-h-[260px] flex flex-col justify-center">
          
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                What is your Business Name?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will be your dedicated multi-tenant cosmetics workspace title.
              </p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Glow Beauty Boutique"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Upload Business Logo URL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your logo will appear on POS thermal receipts, customer invoices, and reports.
              </p>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50">
                <img src={formData.logo} alt="Preview" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Logo Preview</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Select Business Category
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['Retail & Beauty Store', 'Wholesale Distributor', 'Salon & Spa Boutique', 'E-Commerce & POS'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: type })}
                    className={`p-4 rounded-2xl border text-left font-bold text-xs transition-all ${
                      formData.businessType === type 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Base Country
              </h3>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none"
              >
                <option value="United States">United States</option>
                <option value="Kenya">Kenya</option>
                <option value="Somalia">Somalia</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="France">France</option>
                <option value="UAE">United Arab Emirates</option>
              </select>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Default Store Currency
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {['USD ($)', 'EUR (€)', 'GBP (£)', 'KES (KSh)', 'SOS (Sh)'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: curr.split(' ')[0] })}
                    className={`p-3.5 rounded-2xl border text-center font-extrabold text-sm transition-all ${
                      formData.currency === curr.split(' ')[0]
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Timezone
              </h3>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Default Sales Tax / VAT Rate (%)
              </h3>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:outline-none"
                />
                <span className="absolute right-4 font-black text-slate-400">%</span>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Initial Retail Store / Branch Name
              </h3>
              <input
                type="text"
                value={formData.initialBranch}
                onChange={(e) => setFormData({ ...formData, initialBranch: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base"
                placeholder="e.g. Mogadishu Branch"
              />
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Invite Employees & Cashiers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter comma-separated team emails to send RBAC workspace invites.
              </p>
              <textarea
                rows={3}
                value={formData.employeeEmails}
                onChange={(e) => setFormData({ ...formData, employeeEmails: e.target.value })}
                className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Action Button Controls */}
        <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="px-5 py-2.5 rounded-full glass-pill text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Back
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2"
          >
            <span>{step === stepsCount ? 'Finish & Launch Dashboard' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
