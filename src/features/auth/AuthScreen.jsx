import React, { useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  Building, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export default function AuthScreen() {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    loginAsEmployee,
    signupWithEmail, 
    resetPassword,
    authError, 
    setAuthError, 
    loading
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loginType, setLoginType] = useState('owner');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [resetSent, setResetSent] = useState(false);
  const [formShake, setFormShake] = useState(false);

  const triggerError = (msg) => {
    setAuthError(msg);
    setFormShake(true);
    setTimeout(() => setFormShake(false), 500);
  };

  const handleGoogleSubmit = async () => {
    if (loading) return;
    try {
      await loginWithGoogle();
    } catch (err) {
      triggerError(err.message || 'Google authentication failed. Please try again.');
    }
  };

  const chooseLoginType = (type) => {
    setLoginType(type);
    setMode('login');
    setAuthError(null);
    setResetSent(false);
  };

  // Simple password strength calculator (0 - 4)
  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !email.includes('@')) {
      triggerError('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      if (loginType === 'employee') {
        triggerError('Employee password resets are handled by your workspace administrator. Please contact them to reset your access.');
        return;
      }
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err) {
        triggerError(err.message || 'Failed to send reset link.');
      }
      return;
    }

    if (!password || password.length < 6) {
      triggerError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        triggerError('Please enter your full name.');
        return;
      }
      if (!companyName.trim()) {
        triggerError('Please enter your company/organization name.');
        return;
      }

      try {
        await signupWithEmail(email, password, fullName, companyName);
      } catch (err) {
        triggerError(err.message);
      }
    } else {
      try {
        await (loginType === 'employee'
          ? loginAsEmployee(email, password)
          : loginWithEmail(email, password));
      } catch (err) {
        triggerError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#EBF0F7] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-300 selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Animated Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[450px] h-[450px] bg-indigo-500/15 dark:bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[350px] h-[350px] bg-blue-500/15 dark:bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle Pattern Background Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Authentication Container - Scaled to fit single screen without scrolling */}
      <main className="w-full max-w-md mx-auto px-4 my-auto py-6 z-10 animate-fade-scale">
        
        {/* CENTERED LOGO BRAND CONTAINER ABOVE CARD */}
        <div className="flex flex-col items-center justify-center text-center mb-5">
          <div className="relative mb-2 group cursor-pointer">
            {/* Pulsing Outer Halo */}
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 dark:opacity-70 blur-md group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />
            
            {/* Center Logo Icon Box */}
            <div className="relative w-12 h-12 rounded-xl capsule-mesh-gradient flex items-center justify-center shadow-lg border border-white/40 dark:border-white/30 transform group-hover:scale-105 transition-all duration-300">
              <Sparkles className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-spin-slow" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              GUREY<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">GROUP</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
              ENTERPRISE
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium max-w-xs">
            Next-Gen Intelligent SaaS ERP & CRM Platform
          </p>
        </div>

        {/* Auth Glass Card - Optimized to fit without page scrolling */}
        <div className={`rounded-3xl p-6 sm:p-7 shadow-2xl relative border transition-all duration-300 ${
          'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-indigo-500/5 dark:shadow-black/40'
        } ${formShake ? 'animate-shake' : ''}`}>
          
          {/* Card Subheader Title */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' && (loginType === 'employee' ? 'Employee Workspace Login' : 'Sign In to Workspace')}
              {mode === 'signup' && 'Create Business Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {mode === 'login' && (loginType === 'employee' ? 'Use the credentials created when you accepted your invitation.' : 'Enter your owner or administrator credentials to proceed.')}
              {mode === 'signup' && 'Provision your dedicated multi-tenant organization.'}
              {mode === 'forgot' && 'Enter your email to receive reset instructions.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-4 border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => { setMode('login'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Login as</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60">
                <button type="button" onClick={() => chooseLoginType('owner')} className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${loginType === 'owner' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400'}`}>Owner / Admin</button>
                <button type="button" onClick={() => chooseLoginType('employee')} className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${loginType === 'employee' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 dark:text-slate-400'}`}>Employee</button>
              </div>
              {loginType === 'employee' && <p className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-300 font-medium animate-fade-in">You will enter your assigned organization workspace with your role permissions.</p>}
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <div className="flex-1 font-medium leading-snug">{authError}</div>
            </div>
          )}

          {/* Reset Sent Success Notice */}
          {mode === 'forgot' && resetSent && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-fade-in-up">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong className="text-slate-900 dark:text-white">Password Reset Dispatched!</strong>
                <p className="mt-0.5 font-normal">Check your inbox at <u>{email}</u> for reset instructions.</p>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          {mode !== 'forgot' && loginType === 'owner' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2.5 transition-all btn-micro text-xs font-bold group mb-4 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign in with Google Account</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center mb-4">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  Or corporate email
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>
            </>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name field (Signup mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Company Name field (Signup mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Organization Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter business name"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {loginType === 'employee' ? 'Employee Email' : 'Corporate Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setAuthError(null); }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar for Signup */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${passStrength >= 1 ? 'bg-rose-500 w-1/4' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${passStrength >= 2 ? 'bg-amber-500 w-1/4' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${passStrength >= 3 ? 'bg-indigo-500 w-1/4' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${passStrength >= 4 ? 'bg-emerald-500 w-1/4' : 'w-0'}`} />
                    </div>
                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Security Level: {['Weak', 'Fair', 'Good', 'Strong'][passStrength - 1] || 'Too Weak'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all btn-micro mt-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && (loginType === 'employee' ? 'Enter Employee Workspace' : 'Sign In to Workspace')}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setResetSent(false); setAuthError(null); }}
                className="w-full py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium"
              >
                Back to Sign In
              </button>
            )}
          </form>

        </div>

      </main>

      {/* Clean Compact Footer */}
      <footer className="w-full text-center py-3 text-[10px] text-slate-500 dark:text-slate-500 font-medium z-10">
        © 2026 Gurey Group Enterprise SaaS. All rights reserved.
      </footer>

    </div>
  );
}
