"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import type { LanguageContextValue } from "@/types/language";
import portfolioContent from "../../data/content.json";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language, toggleLanguage } = useLanguagePreference();

  return (
    <LanguageContext.Provider
      value={{ language, toggleLanguage, content: portfolioContent[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
