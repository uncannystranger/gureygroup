import React, { useState } from 'react';
import { X, Mail, UserPlus, Copy, CheckCircle2, Building2, Shield, ChevronDown } from 'lucide-react';
import { ROLE_LIST } from '../../core/rbac/permissions';
import { teamAPI } from '../../services/apiService';

export default function InviteModal({ branches = [], onClose, onInviteSent }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const result = await teamAPI.createInvitation({
        email,
        role,
        branchId: branchId || null,
      });
      setInviteResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const url = inviteResult?.inviteUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendAnother = () => {
    setEmail('');
    setRole('Employee');
    setBranchId('');
    setInviteResult(null);
    setError(null);
  };

  const availableRoles = ROLE_LIST.filter(r => r !== 'Owner');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Invite Employee</h3>
            <p className="text-xs text-slate-400">Send an invitation link to join your organization</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{error}</div>
        )}

        {inviteResult ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-400">Invitation created successfully!</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Invitation Link</label>
              <div className="flex items-center space-x-2">
                <input type="text" readOnly value={inviteResult.inviteUrl} className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300" />
                <button onClick={handleCopy} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'}`}>
                  {copied ? <span className="flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5" /><span>Copied!</span></span> : <span className="flex items-center space-x-1"><Copy className="w-3.5 h-3.5" /><span>Copy</span></span>}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Share this link with the employee. Expires in 7 days.</p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button onClick={handleSendAnother} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-xs font-bold hover:bg-indigo-500/20 transition-colors">Invite Another</button>
              <button onClick={onInviteSent} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:scale-105 transition-all">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Employee Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@example.com" className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Assigned Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none">
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {branches.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Assign to Branch</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none">
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading || !email} className="w-full mt-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <><UserPlus className="w-4 h-4" /><span>Send Invitation</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
