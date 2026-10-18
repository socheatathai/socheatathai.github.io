import type { Theme } from "@/types/theme";

export const themeStorageKey = "portfolio-theme";
export const defaultTheme: Theme = "paper";

export const themeSettings = {
  paper: { colorScheme: "light", color: "#f0ece2" },
  black: { colorScheme: "dark", color: "#111111" },
} as const;

export function isTheme(value: unknown): value is Theme {
  return value === "paper" || value === "black";
}

export function resolveTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : defaultTheme;
}

export function applyTheme(theme: Theme) {
  const settings = themeSettings[theme];
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = settings.colorScheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", settings.color);
}

export function readThemePreference(): Theme {
  const currentTheme = resolveTheme(document.documentElement.dataset.theme);
  try {
    const saved = localStorage.getItem(themeStorageKey);
    return isTheme(saved) ? saved : currentTheme;
  } catch {
    return currentTheme;
  }
}

// Runs before hydration so the initial document and the provider share one theme config.
export const themeScript = `(function(){try{var theme=localStorage.getItem(${JSON.stringify(themeStorageKey)})==='black'?'black':'paper';var settings=${JSON.stringify(themeSettings)}[theme];document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=settings.colorScheme;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',settings.color);}catch(e){}})();`;
