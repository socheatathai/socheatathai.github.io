"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function SkipLink() {
  const { content } = useLanguage();
  return (
    <a className="skip-link" href="#main-content">
      {content.common.skipToContent}
    </a>
  );
}
