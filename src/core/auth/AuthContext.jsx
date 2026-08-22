import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  onAuthStateChanged
} from './firebase';
import { getLocalCacheKey } from '../user/userProfileService';
import { authAPI, sessionAPI, teamAPI, verificationAPI } from '../../services/apiService';

const AuthContext = createContext();

const withFirebaseNetworkRetry = async (operation, retries = 2) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (error?.code !== 'auth/network-request-failed' || attempt >= retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const [tenantCompany, setTenantCompany] = useState(null);

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Mirrors the server's record. The frontend never decides this on its own —
  // the API refuses business data until the server agrees the address is
  // confirmed, and this only reflects that decision for routing purposes.
  const [emailVerification, setEmailVerification] = useState({ status: 'unknown', email: null, method: null });

  const normalizeBackendCompany = (company) => {
    if (!company) return null;
    return {
      ...company,
      id: company.id || company.companyId,
      name: company.name || company.companyName || 'Organization',
      tier: company.subscriptionTier || company.tier || 'Production SaaS',
      currency: company.currency || 'USD ($)',
      currencySymbol: company.currencySymbol || company.settings?.currencySymbol || '$',
      timezone: company.timezone || 'UTC',
      // The API stores the tax rate under settings; the UI reads a flat
      // `taxRate`, so without this mapping every screen fell back to a
      // hardcoded rate and Reports rendered a bare "Tax Rate: %".
      taxRate: Number(company.taxRate ?? company.settings?.defaultTaxRate ?? 0),
      lowStockThreshold: Number(company.settings?.lowStockThreshold ?? 10),
      merchantNumber: company.merchantNumber ?? company.settings?.merchantNumber ?? '',
      receiptSettings: company.receiptSettings ?? company.settings?.receipt ?? {},
    };
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent || '';
    const browser = ua.includes('Edg/') ? 'Microsoft Edge'
      : ua.includes('Chrome/') ? 'Chrome'
      : ua.includes('Safari/') ? 'Safari'
      : ua.includes('Firefox/') ? 'Firefox'
      : 'Unknown Browser';
    const os = ua.includes('Mac OS X') ? 'macOS'
      : ua.includes('Windows') ? 'Windows'
      : ua.includes('Android') ? 'Android'
      : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
      : 'Unknown OS';
    const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile device' : 'Desktop device';
    return { browser, os, device, location: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown' };
  };

  const syncBackendAuth = async (fbUser) => {
    // The backend derives identity from this token alone — it is the proof of
    // who the caller is, so it must be fresh and must never be substituted by
    // client-supplied uid/email fields.
    const idToken = await fbUser.getIdToken(/* forceRefresh */ true);
    const synced = await authAPI.syncFirebaseUser({
      idToken,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0],
      photoURL: fbUser.photoURL || '',
    });

    const companyObj = normalizeBackendCompany(synced.company);
    const userObj = {
      uid: synced.user.uid,
      email: synced.user.email,
      displayName: synced.user.displayName || synced.user.email.split('@')[0],
      photoURL: synced.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(synced.user.displayName || synced.user.email)}&background=6366F1&color=fff`,
      // The server's record wins: Firebase's local flag says nothing about
      // whether *this* application considers the address confirmed.
      emailVerified: Boolean(synced.user.emailVerified),
      role: synced.user.role,
      permissions: synced.user.permissions || [],
      companyId: synced.user.companyId,
      accountType: synced.user.accountType || 'owner'
    };

    localStorage.setItem('gurey_auth_token', synced.token);
    localStorage.setItem('gurey_auth_user', JSON.stringify(userObj));
    setEmailVerification({
      status: synced.user.emailVerified ? 'verified' : 'unverified',
      email: synced.user.email,
      method: null,
    });
    localStorage.setItem('gurey_tenant_company', JSON.stringify(companyObj));
    localStorage.setItem('gurey_active_company', companyObj.id);

    if (!sessionStorage.getItem('gurey_current_session_id')) {
      try {
        const sessionRes = await sessionAPI.create({
          ...getDeviceInfo(),
          userName: userObj.displayName,
        });
        if (sessionRes?.session?._id) {
          sessionStorage.setItem('gurey_current_session_id', sessionRes.session._id);
        }
      } catch (err) {
        console.warn('[Auth] Failed to record backend session:', err);
      }
    }

    return { user: userObj, company: companyObj };
  };

  /**
   * The former localStorage "registered accounts" registry has been removed.
   * Account existence, ownership and workspace binding are decided by the API
   * from the verified identity — a client-held list could never be trusted and
   * only risked contradicting the server.
   */

  // Firebase Auth Observer for Session Persistence
  useEffect(() => {
    // Safety timeout: if Firebase never responds, stop loading after 3.5 seconds
    const safetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3500);

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        clearTimeout(safetyTimeout);

        if (fbUser) {
          // Reload user to get fresh emailVerified status
          try {
            await fbUser.reload();
          } catch (e) {
            console.warn("Failed to reload firebase user status:", e);
          }

          try {
            // The API response already carries the stored photo URL; there is
            // no second profile store to reconcile against any more.
            const { user, company } = await syncBackendAuth(fbUser);
            setCurrentUser(user);
            setTenantCompany(company);
            localStorage.setItem('gurey_auth_user', JSON.stringify(user));
          } catch (err) {
            console.error('[Auth] Backend auth synchronization failed:', err);
            setCurrentUser(null);
            setTenantCompany(null);
            localStorage.removeItem('gurey_auth_token');
            localStorage.removeItem('gurey_auth_user');
            localStorage.removeItem('gurey_tenant_company');
            setAuthError(err.message || 'Authentication service is unavailable. Please try again when the backend is reachable.');
          }
        } else {
          const storedToken = localStorage.getItem('gurey_auth_token');
          const storedUser = JSON.parse(localStorage.getItem('gurey_auth_user') || 'null');
          if (storedUser?.authType === 'employee' && storedToken) {
            try {
              const session = await authAPI.me();
              const membership = session.membership || {};
              const backendUser = session.user || {};
              const restoredUser = {
                ...storedUser,
                uid: backendUser.employeeId || backendUser.firebaseUid || storedUser.uid,
                email: backendUser.email || storedUser.email,
                displayName: backendUser.displayName || storedUser.displayName,
                role: membership.role || storedUser.role,
                permissions: membership.permissions || storedUser.permissions || [],
                companyId: membership.companyId || storedUser.companyId,
                // The server's record decides this — assuming `true` here let a
                // restored session skip the gate entirely.
                emailVerified: Boolean(backendUser.emailVerified),
                authType: 'employee',
              };
              const company = normalizeBackendCompany(session.company);
              setCurrentUser(restoredUser);
              setTenantCompany(company);
              setEmailVerification({
                status: restoredUser.emailVerified ? 'verified' : 'unverified',
                email: restoredUser.email,
                method: null,
              });
              localStorage.setItem('gurey_auth_user', JSON.stringify(restoredUser));
              localStorage.setItem('gurey_tenant_company', JSON.stringify(company));
              setAuthLoading(false);
              return;
            } catch (error) {
              console.warn('[Auth] Employee session could not be restored:', error.message);
            }
          }
          // No active Firebase session — always clear state and stale localStorage
          setCurrentUser(null);
          setTenantCompany(null);
          localStorage.removeItem('gurey_auth_user');
          localStorage.removeItem('gurey_tenant_company');
          localStorage.removeItem('gurey_auth_token');
          sessionStorage.removeItem('gurey_current_session_id');
        }
        setAuthLoading(false);
      });
    } catch (authListenerErr) {
      console.warn('[Auth] Auth state listener setup error:', authListenerErr);
      setAuthLoading(false);
    }

    return () => {
      clearTimeout(safetyTimeout);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  /**
   * The API is the authority. If any request comes back with
   * EMAIL_NOT_VERIFIED, drop the local session's verified flag so the app
   * routes to the verification screen instead of rendering empty data.
   */
  useEffect(() => {
    const onUnverified = () => {
      setCurrentUser(prev => (prev && prev.emailVerified ? { ...prev, emailVerified: false } : prev));
      setEmailVerification(prev => ({ ...prev, status: 'unverified' }));
    };
    window.addEventListener('gurey:email-unverified', onUnverified);
    return () => window.removeEventListener('gurey:email-unverified', onUnverified);
  }, []);

  // Sync state changes to LocalStorage.
  // While auth is still resolving, `currentUser` is legitimately null — clearing
  // storage here would erase the very session the observer is about to restore,
  // logging employees out on every page refresh.
  useEffect(() => {
    if (authLoading) return;
    if (currentUser) {
      localStorage.setItem('gurey_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gurey_auth_user');
    }
  }, [currentUser, authLoading]);

  // Periodic session heartbeat (every 60s when logged in)
  useEffect(() => {
    if (!currentUser) return undefined;
    const sendHeartbeat = () => {
      const sessionId = sessionStorage.getItem('gurey_current_session_id');
      sessionAPI.heartbeat(sessionId).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) return;
    if (tenantCompany) {
      localStorage.setItem('gurey_tenant_company', JSON.stringify(tenantCompany));
    } else {
      localStorage.removeItem('gurey_tenant_company');
    }
  }, [tenantCompany, authLoading]);

  // 1. Google OAuth Sign-in
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await withFirebaseNetworkRetry(() => signInWithPopup(auth, googleProvider));
      const fbUser = result.user;

      const { user, company } = await syncBackendAuth(fbUser);
      setCurrentUser(user);
      setTenantCompany(company);
      return { user, company };
    } catch (err) {
      console.error("Google Auth error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign in popup was closed before completion.');
      } else {
        setAuthError(err.message || 'Google sign in failed. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Login
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      let cred;
      try {
        cred = await withFirebaseNetworkRetry(() => signInWithEmailAndPassword(auth, email, password));
      } catch (firebaseError) {
        throw firebaseError;
      }
      const fbUser = cred.user;

      try {
        await fbUser.reload();
      } catch (e) {
        console.warn("Failed to reload user verification status:", e);
      }

      const { user, company } = await syncBackendAuth(fbUser);
      setCurrentUser(user);
      setTenantCompany(company);
      return { user, company };
    } catch (err) {
      console.error("Email Login Error:", err);
      let errMsg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect password. Please try again or reset your password.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Access disabled due to repeated failed attempts. Please reset your password or try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = 'Firebase could not reach the authentication service. Check your connection or browser network blocking and try again.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginAsEmployee = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const employeeResult = await authAPI.employeeLogin({ email, password });
      const company = normalizeBackendCompany(employeeResult.organization);
      const user = {
        ...employeeResult.user,
        emailVerified: Boolean(employeeResult.user?.emailVerified),
        accountType: 'employee',
        authType: 'employee',
      };
      localStorage.setItem('gurey_auth_token', employeeResult.token);
      localStorage.setItem('gurey_auth_user', JSON.stringify(user));
      localStorage.setItem('gurey_tenant_company', JSON.stringify(company));
      localStorage.setItem('gurey_active_company', company?.id || user.companyId);
      setCurrentUser(user);
      setTenantCompany(company);
      return { user, company };
    } catch (err) {
      const message = err.message || 'Unable to sign in to the employee workspace.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Signup (Automatically sends Email Verification)
  const signupWithEmail = async (email, password, fullName, companyName) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;

      // Update user profile display name
      if (fullName) {
        await updateProfile(fbUser, { displayName: fullName }).catch(e => console.warn("Update profile error:", e));
      }

      // Send Email Verification Automatically
      await sendEmailVerification(fbUser).catch(e => {
        console.warn("Automatic verification email dispatch failed:", e);
      });

      const { user, company } = await syncBackendAuth(fbUser);

      const companyObj = companyName ? { ...company, name: companyName } : company;

      setCurrentUser(user);
      setTenantCompany(companyObj);
      localStorage.setItem('gurey_tenant_company', JSON.stringify(companyObj));
      return { user, company: companyObj };
    } catch (err) {
      console.error("Email Signup Error:", err);
      let errMsg = 'Failed to create workspace account.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = `The email address "${email}" is already registered. Please sign in instead.`;
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password must be at least 6 characters long.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Send Verification Email
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error("No active user found. Please log in again.");
    }
    await sendEmailVerification(auth.currentUser);
    return true;
  };

  // 5. Change Email Address during Verification
  const changeUserEmail = async (newEmail) => {
    if (!auth.currentUser) {
      throw new Error("No active user found.");
    }
    await updateEmail(auth.currentUser, newEmail);
    await sendEmailVerification(auth.currentUser);
    
    // Update local user state
    setCurrentUser(prev => prev ? { ...prev, email: newEmail } : null);
    return true;
  };

  // 6. Check Verification Status (reloads Firebase auth state)
  const checkEmailVerificationStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setCurrentUser(prev => prev ? { ...prev, emailVerified: verified } : null);
      return verified;
    }
    return false;
  };

  // 7. Email verification — all state changes are decided by the server.
  const refreshVerificationStatus = async () => {
    try {
      const status = await verificationAPI.status();
      setEmailVerification({
        status: status.emailVerified ? 'verified' : 'unverified',
        email: status.email,
        method: status.method,
      });
      setCurrentUser(prev => prev ? { ...prev, emailVerified: Boolean(status.emailVerified) } : prev);
      return status;
    } catch (err) {
      console.warn('[Auth] Could not read verification status:', err.message);
      return null;
    }
  };

  const requestVerificationEmail = async () => {
    const result = await verificationAPI.request();
    if (result.alreadyVerified) {
      await refreshVerificationStatus();
    }
    return result;
  };

  /** Exchanges a link token for a confirmed address. */
  const confirmVerificationToken = async (token) => {
    const result = await verificationAPI.confirm(token);
    if (result.verified) {
      setEmailVerification(prev => ({ ...prev, status: 'verified' }));
      setCurrentUser(prev => prev ? { ...prev, emailVerified: true } : prev);
    }
    return result;
  };

  // 8. Password Reset
  const resetPassword = async (email) => {
    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error("Password reset error:", err);
      let errMsg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        errMsg = 'No account found with this email address.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async ({ token, email, activationCode, fullName, password, pin }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await teamAPI.acceptInvitation(token, {
        email, displayName: fullName || email.split('@')[0], photoURL: '',
        activationCode, password,
        pin: pin || '',
      });

      const companyObj = normalizeBackendCompany(result.organization);
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.displayName || result.user.email)}&background=6366F1&color=fff`,
        emailVerified: true,
        accountType: 'employee',
        authType: 'employee',
        requiresEmailVerification: false,
        role: result.user.role,
        permissions: result.user.permissions || result.permissions || [],
        companyId: result.user.companyId,
      };

      localStorage.setItem('gurey_auth_token', result.token);
      localStorage.setItem('gurey_auth_user', JSON.stringify(userObj));
      localStorage.setItem('gurey_tenant_company', JSON.stringify(companyObj));
      localStorage.setItem('gurey_active_company', companyObj.id);
      setCurrentUser(userObj);
      setTenantCompany(companyObj);
      return { user: userObj, company: companyObj };
    } catch (err) {
      const errMsg = err.code === 'auth/email-already-in-use'
        ? 'This email already has an account. Sign in first, then reopen the invitation link.'
        : (err.message || 'Failed to accept invitation.');
      setAuthError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 9. Production Logout (Destroy Session Completely)
  const logout = async () => {
    const uid = currentUser?.uid || auth.currentUser?.uid;
    const sessionId = sessionStorage.getItem('gurey_current_session_id');

    setCurrentUser(null);
    setTenantCompany(null);
    window.dispatchEvent(new CustomEvent('gurey:logout'));

    try {
      await sessionAPI.logout(sessionId).catch(() => {});
      await firebaseSignOut(auth).catch(() => {});
    } catch (err) {
      console.warn("Logout error:", err);
    }

    if (uid) {
      localStorage.removeItem(getLocalCacheKey(uid));
    }

    Object.keys(localStorage)
      .filter(k => k.startsWith('gurey_') || k.startsWith('firebase:authUser:'))
      .forEach(k => localStorage.removeItem(k));

    sessionStorage.clear();

    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/login');
      window.location.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      tenantCompany,
      isAuthenticated: !!currentUser,
      isEmailVerified: Boolean(currentUser?.emailVerified),
      loading,
      authLoading,
      authError,
      setAuthError,
      loginWithGoogle,
      loginWithEmail,
      loginAsEmployee,
      signupWithEmail,
      resendVerificationEmail,
      changeUserEmail,
      checkEmailVerificationStatus,
      emailVerification,
      refreshVerificationStatus,
      requestVerificationEmail,
      confirmVerificationToken,
      resetPassword,
      acceptInvitation,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
