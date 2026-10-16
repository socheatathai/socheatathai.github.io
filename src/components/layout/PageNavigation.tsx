"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import PageLink from "@/components/layout/PageLink";

export default function PageNavigation() {
  const pathname = usePathname();
  const { language, content } = useLanguage();
  const km = language === "km";
  const pages = [
    { href: "/", title: content.nav.home },
    { href: "/blog/", title: km ? "ប្លុក" : "Blog" },
    { href: "/about/", title: content.nav.about },
    { href: "/contact/", title: content.contact.title },
  ];
  const path = `${pathname.replace(/\/+$/, "")}/`;
  const isBlogListing = path === "/blog/" || /^\/blog\/page\/[1-9]\d*\/$/.test(path);
  const currentIndex = pages.findIndex((page) => page.href === "/blog/" ? isBlogListing : page.href === path);

  if (currentIndex === -1) return null;

  const previous = pages[currentIndex - 1];
  const next = pages[currentIndex + 1];
  const previousLabel = km ? "មុន" : "Previous";
  const nextLabel = km ? "បន្ទាប់" : "Next";

  return (
    <nav className="page-navigation" aria-label={km ? "ការរុករករវាងទំព័រ" : "Page navigation"}>
      {previous && (
        <PageLink href={previous.href} direction="back" scroll rel="prev" className="page-navigation-link page-navigation-previous">
          <span className="page-navigation-direction">{previousLabel}</span>
          <span className="page-navigation-title">{previous.title}</span>
          <span className="page-navigation-arrow" aria-hidden="true">←</span>
        </PageLink>
      )}
      {next && (
        <PageLink href={next.href} direction="forward" scroll rel="next" className="page-navigation-link page-navigation-next">
          <span className="page-navigation-direction">{nextLabel}</span>
          <span className="page-navigation-title">{next.title}</span>
          <span className="page-navigation-arrow" aria-hidden="true">→</span>
        </PageLink>
      )}
    </nav>
  );
}
