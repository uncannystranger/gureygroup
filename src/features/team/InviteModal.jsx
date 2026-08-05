import React, { useState } from 'react';
import { Mail, UserPlus, Copy, CheckCircle2, Building2, Shield, ChevronDown, User, KeyRound } from 'lucide-react';
import { PERMISSION_GROUPS, ROLE_LIST, ROLE_PERMISSIONS } from '../../core/rbac/permissions';
import { teamAPI } from '../../services/apiService';
import Modal from '../../shared/components/Modal';

export default function InviteModal({ branches = [], onClose, onInviteSent }) {
  const [email, setEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState('Employee');
  const [permissions, setPermissions] = useState(ROLE_PERMISSIONS.Employee || []);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSIONS[nextRole] || []);
  };

  const togglePermission = (permission) => {
    setPermissions(prev => (
      prev.includes(permission)
        ? prev.filter(item => item !== permission)
        : [...prev, permission]
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const result = await teamAPI.createInvitation({
        email,
        employeeName,
        role,
        permissions,
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
    setEmployeeName('');
    setRole('Employee');
    setPermissions(ROLE_PERMISSIONS.Employee || []);
    setBranchId('');
    setInviteResult(null);
    setError(null);
  };

  const availableRoles = ROLE_LIST.filter(r => r !== 'Owner');

  return (
    <Modal isOpen onClose={onClose} title="Invite Employee" className="max-w-3xl">

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 id="invite-employee-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Invite Employee</h3>
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
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Private Activation Code</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><KeyRound className="w-4 h-4 text-amber-500" /><span className="font-black tracking-[0.3em] text-lg text-slate-900 dark:text-white">{inviteResult.activationCode}</span></div>
              <p className="mt-2 text-[10px] text-slate-400">Give this code to the employee separately. It is not sent by email.</p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button onClick={handleSendAnother} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-xs font-bold hover:bg-indigo-500/20 transition-colors">Invite Another</button>
              <button onClick={onInviteSent} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:scale-105 transition-all">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Employee Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Optional name" className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
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
                <select value={role} onChange={(e) => handleRoleChange(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none">
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
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Permissions</label>
              <div className="max-h-56 overflow-y-auto rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">{group.label}</p>
                    <div className="grid grid-cols-1 gap-1">
                      {group.permissions.map(permission => (
                        <label key={permission.key} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <input type="checkbox" checked={permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm transition-colors hover:bg-slate-300 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading || !email} className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <><UserPlus className="w-4 h-4" /><span>Send Invitation</span></>}
            </button></div>
          </form>
        )}
    </Modal>
  );
}
