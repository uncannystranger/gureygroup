import React, { useState } from 'react';
import { X, Send, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function QuickTransferModal({ isOpen, onClose }) {
  const [recipient, setRecipient] = useState('Fernando Alonso');
  const [amount, setAmount] = useState('500.00');
  const [note, setNote] = useState('Q3 Platform Invoice');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shadow-lg">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Transfer Completed!
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Successfully sent <span className="font-bold text-slate-900 dark:text-white">${amount}</span> to {recipient}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>256-BIT ENCRYPTED TRANSFER</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                New Transfer
              </h3>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Recipient Name / IBAN
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Amount (USD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 font-extrabold text-base">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 text-slate-900 dark:text-white text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Reference / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>Confirm & Send Payment</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
