"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import type { Language } from "@/types/language";

const storageKey = "portfolio-language";

export function useLanguagePreference() {
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

  return { language, toggleLanguage };
}
