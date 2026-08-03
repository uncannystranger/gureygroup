import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Key, Trash2, X, Check, Copy } from 'lucide-react';

export function TwoFactorModal({ isOpen, onClose, onEnable }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const secret = 'GUREY-2FA-8914-XK90';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      onEnable();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-4xl p-6 border border-white/80 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Enable Two-Factor Authentication
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs space-y-3">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Scan the QR code below with Google Authenticator, 1Password, or Authy to secure your Gurey Group account.
          </p>

          {/* QR Code Placeholder Box */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
            <div className="w-36 h-36 bg-slate-900 dark:bg-slate-100 p-2 rounded-2xl flex items-center justify-center text-white dark:text-slate-900 font-mono text-[10px] text-center shadow-inner">
              [QR CODE PLACEHOLDER]
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
              <span>Secret Key: <strong className="text-indigo-500">{secret}</strong></span>
              <button onClick={handleCopy} className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-500">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Verification Code Form */}
          <form onSubmit={handleConfirm} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Enter 6-Digit Authenticator Code</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-lg font-mono px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all"
            >
              Verify & Activate 2FA
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export function DeleteAccountModal({ isOpen, onClose, userDisplayName }) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (confirmText.toUpperCase() === 'DELETE' || confirmText === userDisplayName) {
      setIsDeleting(true);
      setTimeout(() => {
        setIsDeleting(false);
        alert('Account deletion request submitted.');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-4xl p-6 border border-rose-500/30 dark:border-rose-500/30 shadow-2xl bg-white/95 dark:bg-slate-900/95 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-950">
          <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Permanently Delete Account
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs space-y-3">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 space-y-1">
            <p className="font-bold">Caution: This action cannot be undone.</p>
            <p className="text-[11px]">Deleting your account will permanently remove all store settings, customer data, and sales history from Gurey Group servers.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Type <strong className="text-rose-600 dark:text-rose-400">DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-rose-300 dark:border-rose-900 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl glass-pill text-slate-700 dark:text-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.toUpperCase() !== 'DELETE' && confirmText !== userDisplayName}
              className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
