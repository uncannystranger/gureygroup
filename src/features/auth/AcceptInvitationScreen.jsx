import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Lock, ShieldCheck, Sparkles, User, XCircle } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { teamAPI } from '../../services/apiService';

const steps = ['Invitation', 'Confirm', 'Activation code', 'Create account'];

export default function AcceptInvitationScreen({ token }) {
  const { acceptInvitation, loading, authError } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    teamAPI.verifyInvitation(token).then(data => {
      setInvitation(data); setFullName(data.employeeName || ''); setStatus('ready');
    }).catch(err => { setError(err.message || 'Invitation is no longer valid.'); setStatus('error'); });
  }, [token]);

  const access = useMemo(() => {
    const permissions = invitation?.permissions || [];
    return permissions.filter(p => ['sales:create', 'orders:view', 'team:view', 'reports:view'].includes(p))
      .map(p => p.split(':')[0] === 'sales' ? 'POS' : p.split(':')[0].replace(/^./, c => c.toUpperCase()))
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [invitation]);

  const next = () => { setError(''); setStep(value => value + 1); };
  const complete = async (e) => {
    e.preventDefault();
    if (activationCode.length !== 6) return setError('Enter the 6-digit activation code from your administrator.');
    if (pin.length < 4) return setError('Create a 4 to 6 digit security PIN.');
    if (password.length < 6) return setError('Create a password with at least 6 characters.');
    try {
      await acceptInvitation({ token, email: invitation.email, activationCode, fullName, password, pin });
      setStatus('accepted');
      setTimeout(() => { window.history.replaceState(null, '', '/'); window.location.assign('/'); }, 900);
    } catch (err) { setError(err.message || 'Activation failed.'); }
  };

  return <div className="min-h-screen w-full flex items-center justify-center bg-[#EBF0F7] dark:bg-[#0B0F17] p-4 page-enter">
    <div className="w-full max-w-md glass-panel rounded-4xl p-6 sm:p-8 border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 shadow-2xl">
      <div className="flex items-center gap-3 mb-7"><div className="w-11 h-11 rounded-2xl capsule-mesh-gradient flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-black text-slate-900 dark:text-white">{invitation ? invitation.companyName : 'Workspace Invitation'}</h1><p className="text-xs text-slate-500 dark:text-slate-400">Secure employee onboarding</p></div></div>
      {status === 'loading' && <div className="flex justify-center py-14"><div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>}
      {status === 'error' && <div className="text-center py-8 space-y-3"><XCircle className="w-12 h-12 mx-auto text-red-400" /><h2 className="font-black text-slate-900 dark:text-white">Invitation unavailable</h2><p className="text-xs text-slate-500">{error}</p></div>}
      {status === 'accepted' && <div className="text-center py-8 space-y-3"><CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400 animate-pulse" /><h2 className="font-black text-slate-900 dark:text-white">Account activated</h2><p className="text-xs text-slate-500">Taking you to your assigned dashboard…</p></div>}
      {status === 'ready' && invitation && <>
        <div className="flex gap-1 mb-7">{steps.map((label, index) => <div key={label} className="flex-1"><div className={`h-1.5 rounded-full ${index <= step ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'} transition-all`} /><span className={`mt-2 block text-[9px] font-bold ${index === step ? 'text-indigo-500' : 'text-slate-400'}`}>{label}</span></div>)}</div>
        {(error || authError) && <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{error || authError}</div>}
        <div className="min-h-[220px] animate-fade-in">
          {step === 0 && <div className="space-y-5"><div><p className="text-xs uppercase tracking-widest font-black text-indigo-500">Invitation received</p><h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Welcome to {invitation.companyName}</h2><p className="mt-3 text-sm text-slate-500">You have been invited to join this workspace.</p></div><div className="p-4 rounded-3xl bg-indigo-500/10 space-y-2 text-sm"><p><span className="text-slate-400">Employee:</span> <b>{invitation.employeeName || invitation.email}</b></p><p><span className="text-slate-400">Company:</span> <b>{invitation.organizationName || invitation.companyName}</b></p><p><span className="text-slate-400">Company owner:</span> <b>{invitation.invitedByName}</b></p><p><span className="text-slate-400">Assigned role:</span> <b>{invitation.role}</b></p></div><button onClick={next} className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black">Continue</button></div>}
          {step === 1 && <div className="space-y-5"><div><p className="text-xs uppercase tracking-widest font-black text-indigo-500">Confirm invitation</p><h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">Your workspace access</h2></div><div className="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-800/60 space-y-3 text-sm"><p><span className="text-slate-400">Company:</span> <b>{invitation.companyName}</b></p><p><span className="text-slate-400">Role:</span> <b>{invitation.role}</b></p><p><span className="text-slate-400">Access:</span> <b>{access.join(', ') || 'Assigned employee workspace'}</b></p></div><button onClick={next} className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black">Accept Invitation</button></div>}
          {step === 2 && <div className="space-y-5"><div><KeyRound className="w-8 h-8 text-indigo-500 mb-3" /><h2 className="text-xl font-black text-slate-900 dark:text-white">Enter your activation code</h2><p className="mt-2 text-sm text-slate-500">Ask your administrator for the code provided with your invitation.</p></div><input autoFocus inputMode="numeric" maxLength={6} value={activationCode} onChange={e => setActivationCode(e.target.value.replace(/\D/g, ''))} placeholder="______" className="w-full text-center tracking-[0.5em] text-2xl py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black" /><button onClick={next} disabled={activationCode.length !== 6} className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black disabled:opacity-50">Verify code</button></div>}
          {step === 3 && <form onSubmit={complete} className="space-y-5"><div><ShieldCheck className="w-8 h-8 text-indigo-500 mb-3" /><h2 className="text-xl font-black text-slate-900 dark:text-white">Create your employee account</h2><p className="mt-2 text-sm text-slate-500">Your invitation email is your login email. Create a password and private security PIN.</p></div><label className="block"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Name</span><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /></div></label><label className="block"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Password</span><input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /></label><label className="block"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Private security PIN</span><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input required inputMode="numeric" minLength={4} maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4–6 digits" className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /></div></label><button disabled={loading} className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black disabled:opacity-50">{loading ? 'Activating…' : 'Activate account'}</button></form>}
        </div>
      </>}
    </div>
  </div>;
}
