import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import {
  loadUserProfile,
  uploadProfileImage,
  getLocalCacheKey
} from './userProfileService';
import { authAPI } from '../../services/apiService';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const { themeMode, setThemeMode, setAccentColor } = useTheme();
  const { currentUser, tenantCompany } = useAuth();

  // -------------------------------------------------------------------
  // Derive a sensible default profile from auth data alone (for instant
  // first-paint from localStorage cache before RTDB responds)
  // -------------------------------------------------------------------
  const getDerivedProfile = (user, company) => {
    const fullName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const first = fullName.split(' ')[0];
    const last = fullName.split(' ').slice(1).join(' ') || '';

    return {
      firstName: first,
      lastName: last,
      displayName: fullName,
      email: user?.email || 'user@example.com',
      phone: 'N/A',
      address: '',
      dateOfBirth: '',
      gender: '',
      businessName: company?.name || `${first}'s Organization`,
      jobTitle: 'Account Owner',
      country: 'United States',
      city: 'Main Location',
      preferredLanguage: 'English (US)',
      timeZone: 'UTC',
      photo: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366F1&color=fff`,

      // Preferences
      theme: 'system',
      language: 'English (US)',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      currency: 'USD ($)',
      emailNotifications: true,
      browserNotifications: true,

      sessions: [
        { id: 'sess_1', device: 'Current Session (Active)', location: 'Current Location', ip: 'Active', lastActive: 'Active now', current: true }
      ]
    };
  };

  // -------------------------------------------------------------------
  // Initialize from per-user localStorage cache for instant render,
  // then RTDB will overwrite with authoritative data.
  // -------------------------------------------------------------------
  const [profile, setProfileState] = useState(() => {
    const uid = currentUser?.uid;
    if (uid) {
      const cacheKey = getLocalCacheKey(uid);
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...getDerivedProfile(currentUser, tenantCompany), ...parsed };
        } catch { /* ignore corrupt cache */ }
      }
    }
    return getDerivedProfile(currentUser, tenantCompany);
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Track whether an RTDB hydration is in progress
  const isHydratingRef = useRef(false);

  // -------------------------------------------------------------------
  // When currentUser changes (login / session restore), load the
  // authoritative profile from RTDB and hydrate state.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser?.uid) {
      setProfileState(getDerivedProfile(null, null));
      return;
    }

    const uid = currentUser.uid;

    // Step 1: Apply per-user localStorage cache instantly (fast paint)
    const cacheKey = getLocalCacheKey(uid);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const merged = { ...getDerivedProfile(currentUser, tenantCompany), ...parsed };
        setProfileState(merged);
        if (parsed.theme && ['system', 'light', 'dark'].includes(parsed.theme)) {
          setThemeMode(parsed.theme);
        }
        if (parsed.accentColor) {
          setAccentColor(parsed.accentColor);
        }
      } catch { /* ignore corrupt cache */ }
    } else {
      setProfileState(getDerivedProfile(currentUser, tenantCompany));
    }

    // Step 2: Load from backend API (authoritative) — overwrites cache
    isHydratingRef.current = true;
    authAPI.me().then(({ user: backendUser }) => {
      isHydratingRef.current = false;
      if (!backendUser) return;

      const merged = {
        ...getDerivedProfile(currentUser, tenantCompany),
        ...backendUser,
        email: currentUser.email || backendUser.email,
        displayName: backendUser.displayName || currentUser.displayName,
        photo: backendUser.photoURL || currentUser.photoURL
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=6366F1&color=fff`
      };

      setProfileState(merged);

      if (backendUser.theme && ['system', 'light', 'dark'].includes(backendUser.theme)) {
        setThemeMode(backendUser.theme);
      }
      if (backendUser.accentColor) {
        setAccentColor(backendUser.accentColor);
      }

      // Update per-user localStorage cache with authoritative data
      localStorage.setItem(cacheKey, JSON.stringify(merged));
    }).catch((err) => {
      isHydratingRef.current = false;
      console.warn('[UserProfileContext] Backend profile hydration failed:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  // -------------------------------------------------------------------
  // Sync theme preference with ThemeContext when profile.theme changes
  // -------------------------------------------------------------------
  useEffect(() => {
    if (profile.theme && profile.theme !== themeMode) {
      setThemeMode(profile.theme);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.theme]);

  // -------------------------------------------------------------------
  // Dynamic time-based greeting calculation
  // -------------------------------------------------------------------
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------------
  // saveProfile — writes to backend API (authoritative) + localStorage cache
  //
  // Photo handling strategy:
  //   1. If photo is a data: URI → try uploading to Firebase Storage
  //      → if Storage succeeds, save the download URL to RTDB
  //      → if Storage fails, save the URL directly to RTDB as fallback
  //   2. If photo is already a URL (pasted link) → save directly to RTDB
  //   3. Photo always persists — never silently reverts on failure
  // -------------------------------------------------------------------
  const saveProfile = async (updatedFields) => {
    const uid = currentUser?.uid;
    const nextProfile = { ...profile, ...updatedFields };

    // Handle photo persistence
    if (updatedFields.photo && uid) {
      if (updatedFields.photo.startsWith('data:')) {
        // Data URI from file upload / camera / crop → try Storage first
        try {
          const downloadURL = await uploadProfileImage(uid, updatedFields.photo);
          nextProfile.photo = downloadURL;
          nextProfile.photoURL = downloadURL;
        } catch (err) {
          console.warn('[UserProfileContext] Storage upload failed, saving photo URL to RTDB directly:', err);
          // Storage failed — save the data URI directly to RTDB as fallback
          // This ensures the photo ALWAYS persists even without Storage
          nextProfile.photoURL = updatedFields.photo;
        }
      } else {
        // Already a URL (pasted link, Unsplash, etc.) — save directly
        nextProfile.photoURL = updatedFields.photo;
      }
    }

    // Apply to React state immediately (optimistic update)
    setProfileState(nextProfile);

    // Persist to backend API (authoritative source of truth)
    if (uid) {
      const apiPayload = {};
      Object.entries(nextProfile).forEach(([key, val]) => {
        if (val !== undefined && val !== null && key !== 'sessions') {
          apiPayload[key] = val;
        }
      });
      apiPayload.photoURL = nextProfile.photo || nextProfile.photoURL;

      const saved = await authAPI.updateProfile(apiPayload);
      if (saved?.user) {
        setProfileState(prev => ({ ...prev, ...saved.user, photo: saved.user.photoURL || prev.photo }));
      }

      // Update per-user localStorage cache
      const cacheKey = getLocalCacheKey(uid);
      localStorage.setItem(cacheKey, JSON.stringify(nextProfile));
    } else {
      localStorage.setItem('gurey_user_profile', JSON.stringify(nextProfile));
    }

    if (updatedFields.theme) {
      setThemeMode(updatedFields.theme);
    }

    showToast('Profile settings saved successfully!');
    return true;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const revokeSession = (sessionId) => {
    const updatedSessions = profile.sessions.filter(s => s.id !== sessionId);
    saveProfile({ sessions: updatedSessions });
    showToast('Session revoked successfully.');
  };

  const revokeAllSessions = () => {
    const currentOnly = profile.sessions.filter(s => s.current);
    saveProfile({ sessions: currentOnly });
    showToast('Logged out from all other devices.');
  };

  return (
    <UserProfileContext.Provider value={{
      profile,
      saveProfile,
      greeting,
      toastMessage,
      showToast,
      revokeSession,
      revokeAllSessions
    }}>
      {children}
      
      {/* Toast Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-2xl border border-white/20">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
