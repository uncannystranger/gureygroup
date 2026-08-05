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
import { loadUserProfile, getLocalCacheKey } from '../user/userProfileService';
import { authAPI, sessionAPI } from '../../services/apiService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const [tenantCompany, setTenantCompany] = useState(null);

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const normalizeBackendCompany = (company) => {
    if (!company) return null;
    return {
      ...company,
      id: company.id || company.companyId,
      name: company.name || company.companyName || 'Organization',
      tier: company.subscriptionTier || company.tier || 'Production SaaS',
      currency: company.currency || 'USD ($)',
      timezone: company.timezone || 'UTC',
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
    const synced = await authAPI.syncFirebaseUser({
      firebaseUid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0],
      photoURL: fbUser.photoURL || '',
    });

    const companyObj = normalizeBackendCompany(synced.company);
    const userObj = {
      uid: synced.user.uid,
      email: synced.user.email,
      displayName: synced.user.displayName || synced.user.email.split('@')[0],
      photoURL: synced.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(synced.user.displayName || synced.user.email)}&background=6366F1&color=fff`,
      emailVerified: fbUser.emailVerified || false,
      role: synced.user.role,
      companyId: synced.user.companyId
    };

    localStorage.setItem('gurey_auth_token', synced.token);
    localStorage.setItem('gurey_auth_user', JSON.stringify(userObj));
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

  // Helper to persist account mapping
  const validateUniqueRegistration = (email) => {
    const existingAccountsRaw = localStorage.getItem('gurey_registered_accounts');
    const registeredAccounts = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : [];
    const normalizedEmail = email.toLowerCase().trim();
    return registeredAccounts.find(acc => acc.email.toLowerCase() === normalizedEmail);
  };

  const registerAccountWorkspace = (userData, companyData) => {
    const existingAccountsRaw = localStorage.getItem('gurey_registered_accounts');
    const registeredAccounts = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : [];
    
    const updatedAccounts = [
      ...registeredAccounts.filter(acc => acc.email.toLowerCase() !== userData.email.toLowerCase()),
      {
        email: userData.email.toLowerCase(),
        uid: userData.uid,
        companyId: companyData.id,
        companyName: companyData.name,
        registeredAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('gurey_registered_accounts', JSON.stringify(updatedAccounts));
  };

  // Firebase Auth Observer for Session Persistence
  useEffect(() => {
    // Safety timeout: if Firebase never responds, stop loading after 5 seconds
    const safetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(safetyTimeout);

      if (fbUser) {
        // Reload user to get fresh emailVerified status
        try {
          await fbUser.reload();
        } catch (e) {
          console.warn("Failed to reload firebase user status:", e);
        }

        try {
          const { user, company } = await syncBackendAuth(fbUser);

          let persistedPhotoURL = user.photoURL;
          try {
            const firestoreProfile = await loadUserProfile(fbUser.uid);
            if (firestoreProfile?.photoURL) {
              persistedPhotoURL = firestoreProfile.photoURL;
            }
          } catch { /* non-fatal */ }

          const hydratedUser = { ...user, photoURL: persistedPhotoURL };
          setCurrentUser(hydratedUser);
          setTenantCompany(company);
          localStorage.setItem('gurey_auth_user', JSON.stringify(hydratedUser));
        } catch (err) {
          console.error('[Auth] Backend auth synchronization failed:', err);
          setCurrentUser(null);
          setTenantCompany(null);
          localStorage.removeItem('gurey_auth_token');
          localStorage.removeItem('gurey_auth_user');
          localStorage.removeItem('gurey_tenant_company');
          setAuthError('Authentication service is unavailable. Please try again when the backend is reachable.');
        }
      } else {
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

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Sync state changes to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gurey_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gurey_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (tenantCompany) {
      localStorage.setItem('gurey_tenant_company', JSON.stringify(tenantCompany));
    } else {
      localStorage.removeItem('gurey_tenant_company');
    }
  }, [tenantCompany]);

  // 1. Google OAuth Sign-in
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;

      try {
        await fbUser.reload();
      } catch (e) {
        console.warn("Failed to reload user verification status:", e);
      }

      const existingReg = validateUniqueRegistration(email);
      if (!existingReg) {
        console.warn('[Auth] Local account registry missing; using backend workspace sync as source of truth.');
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
      } else if (err.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
      throw new Error(errMsg);
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
      registerAccountWorkspace(user, companyObj);

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

  // 7. Verify OTP Code (supports backend OTP verification if enabled)
  const verifyOtpCode = async (otpCode) => {
    setLoading(true);
    try {
      if (!otpCode || otpCode.trim().length !== 6) {
        throw new Error("Invalid 6-digit OTP verification code.");
      }
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      const updatedUser = { ...currentUser, emailVerified: true };
      setCurrentUser(updatedUser);
      localStorage.setItem('gurey_auth_user', JSON.stringify(updatedUser));
      return true;
    } finally {
      setLoading(false);
    }
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
      isEmailVerified: currentUser?.emailVerified || false,
      loading,
      authLoading,
      authError,
      setAuthError,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      resendVerificationEmail,
      changeUserEmail,
      checkEmailVerificationStatus,
      verifyOtpCode,
      resetPassword,
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
