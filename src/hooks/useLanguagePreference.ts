"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import type { Language } from "@/types/language";

const storageKey = "portfolio-language";

export function useLanguagePreference() {
  const [language, setLanguage] = useState<Language>("en");

  useLayoutEffect(() => {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");
    if (urlLanguage === "en" || urlLanguage === "km") setLanguage(urlLanguage);
    try {
      const saved = localStorage.getItem(storageKey);
      if (urlLanguage !== "en" && urlLanguage !== "km" && (saved === "en" || saved === "km"))
        setLanguage(saved);
    } catch {
      // The language switch also works when browser storage is unavailable.
    }

    function syncPreference(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return;
      setLanguage(event.newValue === "km" ? "km" : "en");
    }

    window.addEventListener("storage", syncPreference);
    function syncUrl() {
      if (!window.location.pathname.startsWith("/blog")) return;
      setLanguage(new URLSearchParams(window.location.search).get("lang") === "km" ? "km" : "en");
    }
    window.addEventListener("popstate", syncUrl);
    return () => {
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener("popstate", syncUrl);
    };
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
