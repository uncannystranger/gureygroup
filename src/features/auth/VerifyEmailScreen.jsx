import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { 
  Mail, 
  ShieldAlert, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Edit3,
  Send,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function VerifyEmailScreen() {
  const { 
    currentUser, 
    resendVerificationEmail, 
    changeUserEmail, 
    checkEmailVerificationStatus, 
    verifyOtpCode,
    logout 
  } = useAuth();

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Change email modal / state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(currentUser?.email || '');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification email.');
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setErrorMsg(null);
    try {
      const isVerified = await checkEmailVerificationStatus();
      if (!isVerified) {
        setErrorMsg('Your email is still unverified. Please click the link in your verification email or try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification status check failed.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP verification code.');
      return;
    }
    try {
      await verifyOtpCode(otpCode);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP verification code.');
    }
  };

  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setIsUpdatingEmail(true);
    setErrorMsg(null);
    try {
      await changeUserEmail(newEmail);
      setIsEditingEmail(false);
      setResendSuccess(true);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#EBF0F7] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decorative Glow Nodes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/20 dark:bg-amber-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar - Clean Logo Only */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl capsule-mesh-gradient flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="w-full max-w-lg mx-auto px-4 my-auto z-10 animate-fade-scale">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative border border-white/60 dark:border-white/10 space-y-6">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
              <Mail className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Verify Your Email Address
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Your email has not been verified yet. Please verify your email before continuing to access the platform.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentUser?.email}</span>
              <button 
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] ml-1 flex items-center gap-0.5"
                title="Change Email Address"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          {/* Change Email Form Modal Inline */}
          {isEditingEmail && (
            <form onSubmit={handleChangeEmailSubmit} className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in-up">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" /> Change Email Address
              </h4>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email..."
                  className="w-full pl-3 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 btn-micro flex items-center gap-1"
                >
                  {isUpdatingEmail ? 'Saving...' : 'Update & Resend'}
                </button>
              </div>
            </form>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Resend Success Banner */}
          {resendSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">Verification email dispatched! Check your inbox or spam folder.</div>
            </div>
          )}

          {/* Verification Method 1: Click Email Link */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-500" /> Option 1: Verification Link
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              We sent a verification link to your inbox. Click the link in the email, then return here and click <strong>I've Verified My Email</strong> below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 btn-micro"
              >
                {isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>I've Verified My Email</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-micro"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'text-indigo-500'}`} />
                <span>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                </span>
              </button>
            </div>
          </div>

          {/* Verification Method 2: OTP Code Verification */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" /> Option 2: Enter OTP Code
            </h3>
            <form onSubmit={handleVerifyOtp} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6-digit OTP code"
                className="flex-1 pl-3 pr-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md hover:scale-105 transition-all btn-micro shrink-0"
              >
                Verify Code
              </button>
            </form>
          </div>

          {/* Back to Login / Sign Out Button */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 dark:text-slate-600 z-10">
        Enterprise SaaS Secure Authentication Architecture.
      </footer>

    </div>
  );
}
