import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './translations/en.json';
import soTranslations from './translations/so.json';

const translations = {
  en: enTranslations,
  so: soTranslations
};

const LanguageContext = createContext();

const SOMALI_MONTHS = [
  'Jannaayo', 'Feabraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun',
  'Luuliyo', 'Agoosto', 'Sitteembar', 'Oktoobar', 'Nofeembar', 'Diseembar'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('gurey_app_language');
      if (saved && (saved === 'en' || saved === 'so')) {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for language preference:', e);
    }
    return 'en';
  });

  const setLanguage = (lang) => {
    if (lang !== 'en' && lang !== 'so') return;
    setLanguageState(lang);
    try {
      localStorage.setItem('gurey_app_language', lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  };

  /**
   * Translates a dot-notated string key (e.g., 'nav.dashboard' or 'status.in_stock')
   * Fallback to English translation, then default text if missing.
   */
  const t = (keyPath, defaultText = '') => {
    if (!keyPath) return defaultText;

    const keys = keyPath.split('.');
    let result = translations[language];

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        result = undefined;
        break;
      }
    }

    if (result !== undefined && typeof result === 'string') {
      return result;
    }

    // Fallback to English if current language is 'so' and key wasn't found
    if (language !== 'en') {
      let fallbackResult = translations.en;
      for (const key of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && key in fallbackResult) {
          fallbackResult = fallbackResult[key];
        } else {
          fallbackResult = undefined;
          break;
        }
      }
      if (fallbackResult !== undefined && typeof fallbackResult === 'string') {
        return fallbackResult;
      }
    }

    return defaultText || keyPath;
  };

  /**
   * Format date according to language rules.
   * English: "August 3, 2026"
   * Somali: "3 Agoosto 2026"
   * Relative dates: Today -> Maanta, Yesterday -> Shalay, Tomorrow -> Berri
   */
  const formatDate = (dateInput) => {
    if (!dateInput) return '';

    if (typeof dateInput === 'string') {
      const lower = dateInput.trim().toLowerCase();
      if (lower === 'today' || lower.startsWith('today')) {
        const timePart = dateInput.includes(',') ? dateInput.split(',')[1] : '';
        const todayWord = language === 'so' ? 'Maanta' : 'Today';
        return timePart ? `${todayWord},${timePart}` : todayWord;
      }
      if (lower === 'yesterday' || lower.startsWith('yesterday')) {
        const timePart = dateInput.includes(',') ? dateInput.split(',')[1] : '';
        const yesterdayWord = language === 'so' ? 'Shalay' : 'Yesterday';
        return timePart ? `${yesterdayWord},${timePart}` : yesterdayWord;
      }
      if (lower === 'tomorrow' || lower.startsWith('tomorrow')) {
        const timePart = dateInput.includes(',') ? dateInput.split(',')[1] : '';
        const tomorrowWord = language === 'so' ? 'Berri' : 'Tomorrow';
        return timePart ? `${tomorrowWord},${timePart}` : tomorrowWord;
      }
    }

    let dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);

    if (isNaN(dateObj.getTime())) {
      // If parsing failed, return original string with basic string replacements if any
      if (typeof dateInput === 'string') {
        let str = dateInput;
        if (language === 'so') {
          str = str.replace(/\bToday\b/g, 'Maanta')
                   .replace(/\bYesterday\b/g, 'Shalay')
                   .replace(/\bTomorrow\b/g, 'Berri')
                   .replace(/\bAug\b/g, 'Ago')
                   .replace(/\bAugust\b/g, 'Agoosto');
        }
        return str;
      }
      return String(dateInput);
    }

    const day = dateObj.getDate();
    const monthIndex = dateObj.getMonth();
    const year = dateObj.getFullYear();

    if (language === 'so') {
      const monthName = SOMALI_MONTHS[monthIndex];
      return `${day} ${monthName} ${year}`;
    } else {
      const monthName = ENGLISH_MONTHS[monthIndex];
      return `${monthName} ${day}, ${year}`;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
