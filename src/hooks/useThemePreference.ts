"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import {
  applyTheme,
  defaultTheme,
  readThemePreference,
  resolveTheme,
  themeStorageKey,
} from "@/lib/theme";
import type { Theme } from "@/types/theme";

export function useThemePreference() {
  // Match the server render; restore the boot script's preference before paint.
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useLayoutEffect(() => {
    const restored = readThemePreference();
    applyTheme(restored);
    setTheme(restored);

    function syncPreference(event: StorageEvent) {
      if (event.key !== themeStorageKey && event.key !== null) return;
      const next = resolveTheme(event.newValue);
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
      localStorage.setItem(themeStorageKey, next);
    } catch {
      // Keep the chosen theme for this visit if saving is unavailable.
    }
  }, [theme]);

  return { theme, toggleTheme };
}
