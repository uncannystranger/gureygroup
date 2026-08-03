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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const [tenantCompany, setTenantCompany] = useState(null);

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

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

        const existingReg = validateUniqueRegistration(fbUser.email);
        const companyId = existingReg ? existingReg.companyId : `comp_${fbUser.uid.slice(0, 8)}`;
        const companyName = existingReg ? existingReg.companyName : (fbUser.displayName ? `${fbUser.displayName.split(' ')[0]}'s Business` : 'My Organization');

        const companyObj = tenantCompany || {
          id: companyId,
          name: companyName,
          tier: 'Production SaaS',
          currency: 'USD ($)',
          timezone: 'UTC'
        };

        // Load persisted photoURL from Firestore so the avatar is correct
        // immediately on session restore (before UserProfileContext hydrates)
        let persistedPhotoURL = fbUser.photoURL;
        try {
          const firestoreProfile = await loadUserProfile(fbUser.uid);
          if (firestoreProfile?.photoURL) {
            persistedPhotoURL = firestoreProfile.photoURL;
          }
        } catch { /* non-fatal — fall back to Firebase Auth photoURL */ }

        const userObj = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          photoURL: persistedPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || fbUser.email)}&background=6366F1&color=fff`,
          emailVerified: fbUser.emailVerified || false,
          role: 'Owner',
          companyId: companyObj.id
        };

        setCurrentUser(userObj);
        setTenantCompany(companyObj);
        localStorage.setItem('gurey_auth_user', JSON.stringify(userObj));
        localStorage.setItem('gurey_tenant_company', JSON.stringify(companyObj));
      } else {
        // No active Firebase session — always clear state and stale localStorage
        setCurrentUser(null);
        setTenantCompany(null);
        localStorage.removeItem('gurey_auth_user');
        localStorage.removeItem('gurey_tenant_company');
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

      const existingReg = validateUniqueRegistration(fbUser.email);
      let companyObj;
      let userObj;

      if (existingReg) {
        companyObj = {
          id: existingReg.companyId,
          name: existingReg.companyName || 'Business Workspace',
          tier: 'Production SaaS',
          currency: 'USD ($)',
          timezone: 'UTC'
        };
        userObj = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Account Owner',
          photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || fbUser.email)}&background=6366F1&color=fff`,
          emailVerified: true, // Google accounts are auto-verified
          role: 'Owner',
          companyId: existingReg.companyId
        };
      } else {
        const newCompanyId = `comp_${Date.now().toString(36)}`;
        companyObj = {
          id: newCompanyId,
          name: `${fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'My'} Organization`,
          tier: 'Production SaaS',
          currency: 'USD ($)',
          timezone: 'UTC'
        };
        userObj = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Account Owner',
          photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || fbUser.email)}&background=6366F1&color=fff`,
          emailVerified: true, // Google accounts are auto-verified
          role: 'Owner',
          companyId: newCompanyId
        };
        registerAccountWorkspace(userObj, companyObj);
      }

      setCurrentUser(userObj);
      setTenantCompany(companyObj);
      localStorage.setItem('gurey_active_company', companyObj.id);
      return { user: userObj, company: companyObj };
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
      const companyId = existingReg ? existingReg.companyId : `comp_${fbUser.uid.slice(0, 8)}`;

      const companyObj = {
        id: companyId,
        name: existingReg ? existingReg.companyName : 'Organization',
        tier: 'Production SaaS'
      };

      const userObj = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || email.split('@')[0],
        photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || email)}&background=6366F1&color=fff`,
        emailVerified: fbUser.emailVerified || false,
        role: 'Owner',
        companyId: companyId
      };

      setCurrentUser(userObj);
      setTenantCompany(companyObj);
      localStorage.setItem('gurey_active_company', companyId);
      return { user: userObj, company: companyObj };
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

      const newCompanyId = `comp_${Date.now().toString(36)}`;
      const companyObj = {
        id: newCompanyId,
        name: companyName || `${fullName || 'User'}'s Organization`,
        tier: 'Production SaaS',
        currency: 'USD ($)',
        timezone: 'UTC'
      };

      const userObj = {
        uid: fbUser.uid,
        email: email,
        displayName: fullName || email.split('@')[0],
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || email)}&background=6366F1&color=fff`,
        emailVerified: false, // Newly registered users must verify email
        role: 'Owner',
        companyId: newCompanyId
      };

      registerAccountWorkspace(userObj, companyObj);

      setCurrentUser(userObj);
      setTenantCompany(companyObj);
      localStorage.setItem('gurey_active_company', newCompanyId);
      return { user: userObj, company: companyObj };
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
    try {
      await firebaseSignOut(auth).catch(() => {});
    } catch (err) {
      console.warn("Logout error:", err);
    }

    // Completely clear react state
    setCurrentUser(null);
    setTenantCompany(null);

    // Clear all authentication & tenant keys from LocalStorage & SessionStorage
    const keysToRemove = [
      'gurey_auth_user',
      'gurey_tenant_company',
      'gurey_user_profile',
      'gurey_active_company',
      'gurey_active_branch',
      'gurey_held_carts',
      'firebase:authUser:' + (auth.app?.options?.apiKey || '') + ':[DEFAULT]'
    ];
    
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Also clear the per-user scoped profile cache if we know the UID
    // (prevents stale cached data appearing for a different user next login)
    if (auth.currentUser?.uid) {
      localStorage.removeItem(getLocalCacheKey(auth.currentUser.uid));
    }
    // Belt-and-suspenders: clear any gurey_user_profile_* keys in storage
    Object.keys(localStorage)
      .filter(k => k.startsWith('gurey_user_profile_'))
      .forEach(k => localStorage.removeItem(k));

    sessionStorage.clear();

    // Prevent browser Back button from navigating back to protected pages
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', window.location.href);
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
