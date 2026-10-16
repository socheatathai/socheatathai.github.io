import type portfolioContent from "../../data/content.json";

export type Language = "en" | "km";

export type PortfolioContent = (typeof portfolioContent)[Language];

export type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  content: PortfolioContent;
};
