"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function SkipLink() {
  const { language } = useLanguage();
  return <a className="skip-link" href="#main-content">{language === "km" ? "រំលងទៅមាតិកា" : "Skip to content"}</a>;
}
