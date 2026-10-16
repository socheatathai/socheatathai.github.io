"use client";

import Link from "@/components/layout/PageLink";
import PageTransition from "@/components/layout/PageTransition";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFound() {
  const { language } = useLanguage();
  const km = language === "km";

  return <PageTransition><div className="not-found"><p className="eyebrow">{km ? "៤០៤ · រកមិនឃើញទំព័រ" : "404 · Page not found"}</p><h1>{km ? "ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានទេ។" : "This page took a different path."}</h1><p>{km ? "សូមអានប្លុក ឬត្រឡប់ទៅទំព័រដើម។" : "Explore the blog or head back to the home page."}</p><Link className="button" href="/" direction="back">{km ? "ត្រឡប់ទៅទំព័រដើម" : "Back to home"} <span aria-hidden="true">↗</span></Link></div></PageTransition>;
}
