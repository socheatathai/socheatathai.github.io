"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import portfolioContent from "../../data/content.json";

type Language = "en" | "km";
type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  content: (typeof portfolioContent)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "portfolio-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "en" || saved === "km") setLanguage(saved);
    } catch {
      // The language switch also works when browser storage is unavailable.
    }
    function syncPreference(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return;
      setLanguage(event.newValue === "km" ? "km" : "en");
    }
    window.addEventListener("storage", syncPreference);
    return () => window.removeEventListener("storage", syncPreference);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    const nextLanguage = language === "en" ? "km" : "en";
    setLanguage(nextLanguage);
    try {
      localStorage.setItem(storageKey, nextLanguage);
    } catch {
      // Keep the in-memory preference for this visit.
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, content: portfolioContent[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
