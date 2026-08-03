import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themePresets = [
  { id: 'indigo', name: 'Soft Indigo', hex: '#6366F1', bgClass: 'bg-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
  { id: 'blue', name: 'Electric Blue', hex: '#3B82F6', bgClass: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  { id: 'purple', name: 'Royal Purple', hex: '#8B5CF6', bgClass: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]' },
  { id: 'green', name: 'Emerald Green', hex: '#10B981', bgClass: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  { id: 'orange', name: 'Vibrant Orange', hex: '#F97316', bgClass: 'bg-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
];

export function ThemeProvider({ children }) {
  // Theme Mode: 'system' | 'light' | 'dark'
  const [themeMode, setThemeModeState] = useState(() => {
    const saved = localStorage.getItem('gurey_theme');
    if (saved && ['system', 'light', 'dark'].includes(saved)) {
      return saved;
    }
    const legacy = localStorage.getItem('gurey_dark_mode');
    if (legacy !== null) {
      return legacy === 'true' ? 'dark' : 'light';
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('gurey_accent') || 'indigo';
  });

  const [customLogo, setCustomLogo] = useState(() => {
    return localStorage.getItem('gurey_custom_logo') || null;
  });

  // Determine current active dark mode state
  const darkMode = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('gurey_theme', mode);
    if (mode === 'dark') {
      localStorage.setItem('gurey_dark_mode', 'true');
    } else if (mode === 'light') {
      localStorage.setItem('gurey_dark_mode', 'false');
    } else {
      localStorage.removeItem('gurey_dark_mode');
    }
  };

  const setDarkMode = (val) => {
    if (typeof val === 'boolean') {
      setThemeMode(val ? 'dark' : 'light');
    } else if (typeof val === 'function') {
      const nextVal = val(darkMode);
      setThemeMode(nextVal ? 'dark' : 'light');
    }
  };

  // Listen to OS prefers-color-scheme changes when mode is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Update HTML class immediately when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Enable smooth 150-250ms transitions ONLY after initial paint
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('gurey_accent', accentColor);
  }, [accentColor]);

  const activePreset = themePresets.find(p => p.id === accentColor) || themePresets[0];

  return (
    <ThemeContext.Provider value={{
      themeMode,
      setThemeMode,
      darkMode,
      setDarkMode,
      accentColor,
      setAccentColor,
      customLogo,
      setCustomLogo,
      activePreset,
      themePresets
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
