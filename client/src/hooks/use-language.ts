import { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translation, getTranslation } from '@/../../shared/i18n';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useLanguageProvider() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Check localStorage for saved language preference
    const saved = localStorage.getItem('netmon-language');
    return (saved as Language) || 'tr';
  });

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('netmon-language', lang);
  };

  const t = getTranslation(currentLanguage);

  useEffect(() => {
    // Update document language attribute
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return {
    currentLanguage,
    setLanguage,
    t,
  };
}