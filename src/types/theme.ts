export type Theme = "paper" | "black";

export type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};
