"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { language, content } = useLanguage();
  return <footer className="site-footer"><span>{content.footer}</span><a href="#main-content">{language === "km" ? "ត្រឡប់ទៅខាងលើ" : "Back to top"}<span aria-hidden="true"> ↑</span></a></footer>;
}
