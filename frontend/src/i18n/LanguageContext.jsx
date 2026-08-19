import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'etrans_lang';

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    // localStorage indisponible, on ignore
  }
  return 'fr';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    changeLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, changeLang]);

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.fr[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit être utilisé dans un LanguageProvider');
  return ctx;
}
