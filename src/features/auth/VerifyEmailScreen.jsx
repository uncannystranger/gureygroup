import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  LogOut,
  Sparkles,
  Inbox,
} from 'lucide-react';

/**
 * Shown when the server reports the signed-in account's address is not yet
 * confirmed. This screen cannot grant access on its own — the API refuses
 * business data until the backend record flips, so it only drives the flow.
 */
export default function VerifyEmailScreen() {
  const {
    currentUser,
    emailVerification,
    requestVerificationEmail,
    refreshVerificationStatus,
    logout,
  } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [devLink, setDevLink] = useState(null);

  const email = emailVerification?.email || currentUser?.email;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // The link is opened in another tab or on a phone, so poll gently rather
  // than making the user hunt for a "check again" button.
  useEffect(() => {
    const interval = setInterval(() => { refreshVerificationStatus(); }, 10000);
    return () => clearInterval(interval);
  }, [refreshVerificationStatus]);

  const handleSend = useCallback(async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await requestVerificationEmail();
      if (result.alreadyVerified) {
        setNotice('That address is already confirmed — loading your workspace.');
        return;
      }
      setCooldown(60);
      setNotice(
        result.delivered
          ? `We sent a confirmation link to ${result.email}. It expires in 24 hours.`
          : `A confirmation link was created for ${result.email}. Email delivery is not configured on this server, so use the link below.`
      );
      if (result.devLink) setDevLink(result.devLink);
    } catch (err) {
      setError(err.message || 'We could not send that email. Please try again shortly.');
    } finally {
      setSending(false);
    }
  }, [cooldown, sending, requestVerificationEmail]);

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    const status = await refreshVerificationStatus();
    if (status && !status.emailVerified) {
      setError('Not confirmed yet. Open the link in the email, then check again.');
    }
    setChecking(false);
  };

  return (
    <div className="ds-app-shell min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-[20%] left-[15%] w-[540px] h-[540px] rounded-full blur-[150px] pointer-events-none bg-[var(--ds-accent)] opacity-[0.10] dark:opacity-[0.16]" />

      <main className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-11 h-11 rounded-2xl capsule-mesh-gradient grid place-items-center mb-3">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </span>
          <h1 className="ds-display text-2xl">Confirm your email</h1>
          <p className="ds-body mt-2 max-w-sm">
            One step before your workspace opens. We need to know this address reaches you.
          </p>
        </div>

        <section className="glass glass-strong rounded-3xl p-6 sm:p-7">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: 'var(--ds-accent-soft)' }}>
            <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ds-accent)' }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="ds-caption">Confirmation will be sent to</p>
              <p className="ds-heading break-all">{email}</p>
            </div>
          </div>

          {notice && (
            <p className="ds-body mt-4 flex items-start gap-2 animate-fade-in-up" role="status">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ds-positive)' }} aria-hidden="true" />
              <span>{notice}</span>
            </p>
          )}

          {error && (
            <p className="ds-body mt-4 flex items-start gap-2 animate-fade-in-up" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ds-critical)' }} aria-hidden="true" />
              <span style={{ color: 'var(--ds-critical)' }}>{error}</span>
            </p>
          )}

          {devLink && (
            <div className="mt-4 p-3 rounded-xl ds-surface-sunken">
              <p className="ds-caption mb-1.5">Development link (SMTP not configured on this server)</p>
              <a href={devLink} className="ds-link text-xs break-all">{devLink}</a>
            </div>
          )}

          <div className="mt-5 grid gap-2.5">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || cooldown > 0}
              className="ds-btn ds-btn-primary w-full"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} aria-hidden="true" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? 'Sending…' : 'Send confirmation link'}
            </button>

            <button type="button" onClick={handleCheck} disabled={checking} className="ds-btn ds-btn-secondary w-full">
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
              {checking ? 'Checking…' : "I've confirmed it"}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--ds-border)' }}>
            <p className="ds-caption flex items-start gap-2">
              <Inbox className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>Nothing arrived? Check spam, then resend. Each new link replaces the previous one.</span>
            </p>
          </div>
        </section>

        <button type="button" onClick={logout} className="ds-btn ds-btn-ghost ds-btn-sm w-full mt-4">
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign out
        </button>
      </main>
    </div>
  );
}
