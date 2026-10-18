"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { content } = useLanguage();
  return (
    <footer className="site-footer">
      <span>{content.footer}</span>
      <a href="#main-content">
        {content.common.backToTop}
        <span aria-hidden="true"> ↑</span>
      </a>
    </footer>
  );
}
