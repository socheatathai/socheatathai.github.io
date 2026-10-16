"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from "react";

type Theme = "paper" | "black";
type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const storageKey = "portfolio-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "black" ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "black" ? "#111111" : "#f0ece2");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Match the server render; restore the boot script's preference before paint.
  const [theme, setTheme] = useState<Theme>("paper");

  useLayoutEffect(() => {
    let restored: Theme = document.documentElement.dataset.theme === "black" ? "black" : "paper";
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "paper" || saved === "black") restored = saved;
    } catch {
      // Theme selection still works when browser storage is unavailable.
    }
    applyTheme(restored);
    setTheme(restored);

    function syncPreference(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return;
      const next: Theme = event.newValue === "black" ? "black" : "paper";
      applyTheme(next);
      setTheme(next);
    }
    window.addEventListener("storage", syncPreference);
    return () => window.removeEventListener("storage", syncPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "paper" ? "black" : "paper";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Keep the chosen theme for this visit if saving is unavailable.
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
