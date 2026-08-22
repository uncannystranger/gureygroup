import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import { verificationAPI } from '../../services/apiService';

/**
 * Landing page for /verify-email/:token.
 *
 * Deliberately works without a session: the link is often opened on a
 * different device from the one that requested it, and the token itself is
 * the proof. Each outcome the server can return gets its own explanation and
 * its own next step, rather than a single "invalid link" dead end.
 */
const OUTCOMES = {
  verified: {
    icon: CheckCircle2,
    tone: 'var(--ds-positive)',
    soft: 'var(--ds-positive-soft)',
    title: 'Email confirmed',
    body: 'Your address is confirmed. You can head into your workspace now.',
  },
  already_verified: {
    icon: CheckCircle2,
    tone: 'var(--ds-positive)',
    soft: 'var(--ds-positive-soft)',
    title: 'Already confirmed',
    body: 'This address was confirmed earlier — nothing else to do.',
  },
  expired: {
    icon: Clock,
    tone: 'var(--ds-warning)',
    soft: 'var(--ds-warning-soft)',
    title: 'This link has expired',
    body: 'Confirmation links last 24 hours. Sign in and request a fresh one.',
  },
  used: {
    icon: RotateCcw,
    tone: 'var(--ds-warning)',
    soft: 'var(--ds-warning-soft)',
    title: 'This link was already used',
    body: 'Each link works once. Sign in to request another if you still need it.',
  },
  superseded: {
    icon: RotateCcw,
    tone: 'var(--ds-warning)',
    soft: 'var(--ds-warning-soft)',
    title: 'A newer link was sent',
    body: 'Open the most recent confirmation email instead — this one is no longer active.',
  },
  invalid: {
    icon: AlertCircle,
    tone: 'var(--ds-critical)',
    soft: 'var(--ds-critical-soft)',
    title: 'This link is not valid',
    body: 'It may have been altered or truncated by your email client. Sign in and request a new one.',
  },
};

export default function VerifyEmailLanding({ token }) {
  const [state, setState] = useState({ loading: true, status: null, email: null });
  // A verification link is single-use, so this must fire exactly once. Without
  // the guard, StrictMode's double-invoked effect sent two concurrent
  // confirmations and the one that lost the race reported the link as invalid.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    verificationAPI.confirm(token)
      .then((result) => {
        setState({ loading: false, status: result.status || 'verified', email: result.email });
      })
      .catch((err) => {
        // The endpoint names the precise outcome; only fall back to "invalid"
        // when the request itself could not be understood.
        setState({ loading: false, status: err.verificationStatus || 'invalid', email: err.email || null });
      });
  }, [token]);

  const outcome = OUTCOMES[state.status] || OUTCOMES.invalid;
  const Icon = outcome.icon;
  const succeeded = state.status === 'verified' || state.status === 'already_verified';

  return (
    <div className="ds-app-shell min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-[20%] left-[15%] w-[540px] h-[540px] rounded-full blur-[150px] pointer-events-none bg-[var(--ds-accent)] opacity-[0.10] dark:opacity-[0.16]" />

      <main className="relative w-full max-w-md text-center">
        <span className="w-11 h-11 rounded-2xl capsule-mesh-gradient grid place-items-center mx-auto mb-5">
          <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
        </span>

        <section className="glass glass-strong rounded-3xl p-7">
          {state.loading ? (
            <div className="flex flex-col items-center gap-3 py-4" role="status" aria-live="polite">
              <span className="ds-progress-line w-32" />
              <p className="ds-caption">Confirming your link…</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <span
                className="grid place-items-center w-12 h-12 rounded-2xl mx-auto mb-4"
                style={{ background: outcome.soft, color: outcome.tone }}
                aria-hidden="true"
              >
                <Icon className="w-6 h-6" />
              </span>
              <h1 className="ds-title">{outcome.title}</h1>
              <p className="ds-body mt-2">{outcome.body}</p>
              {state.email && <p className="ds-caption mt-2 break-all">{state.email}</p>}

              <a href="/" className="ds-btn ds-btn-primary w-full mt-6">
                {succeeded ? 'Continue to workspace' : 'Back to sign in'}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
