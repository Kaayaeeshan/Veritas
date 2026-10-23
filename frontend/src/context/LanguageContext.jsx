import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "veritas_language";
const SUPPORTED = ["en", "si", "ta"];

function getInitialLanguage() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return SUPPORTED.includes(stored) ? stored : "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((lang) => {
    if (!SUPPORTED.includes(lang)) return;
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key) => {
      const lookup = (lang) =>
        key.split(".").reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), translations[lang]);
      return lookup(language) ?? lookup("en") ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, supportedLanguages: SUPPORTED }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
