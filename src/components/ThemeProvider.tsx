"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useThemePreference } from "@/hooks/useThemePreference";
import type { ThemeContextValue } from "@/types/theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemePreference();
  return <ThemeContext.Provider value={preference}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
