"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LayoutIcon } from "./icons";

export default function LanguageToggle() {
  const { language, toggleLanguage, content } = useLanguage();
  return (
    <button
      className="language-toggle"
      type="button"
      onClick={toggleLanguage}
      aria-label={content.buttons.languageAction}
    >
      <LayoutIcon name="language" size={18} strokeWidth={1.6} />
      <span lang={language === "en" ? "km" : "en"}>{content.buttons.language}</span>
    </button>
  );
}
