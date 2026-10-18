"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import PageLink from "@/components/layout/PageLink";
import { getNavigationItems, normalizePathname } from "@/lib/navigation";

export default function PageNavigation() {
  const pathname = usePathname();
  const { content } = useLanguage();
  const pages = getNavigationItems(content.nav);
  const path = normalizePathname(pathname);
  const isBlogListing = path === "/blog/" || /^\/blog\/page\/[1-9]\d*\/$/.test(path);
  const currentIndex = pages.findIndex((page) =>
    page.href === "/blog/" ? isBlogListing : page.href === path,
  );

  if (currentIndex === -1) return null;

  const previous = pages[currentIndex - 1];
  const next = pages[currentIndex + 1];

  return (
    <nav className="page-navigation" aria-label={content.pageNavigation.label}>
      {previous && (
        <PageLink
          href={previous.href}
          direction="back"
          scroll
          rel="prev"
          className="page-navigation-link page-navigation-previous"
        >
          <span className="page-navigation-direction">{content.pageNavigation.previous}</span>
          <span className="page-navigation-title">{previous.label}</span>
          <span className="page-navigation-arrow" aria-hidden="true">
            ←
          </span>
        </PageLink>
      )}
      {next && (
        <PageLink
          href={next.href}
          direction="forward"
          scroll
          rel="next"
          className="page-navigation-link page-navigation-next"
        >
          <span className="page-navigation-direction">{content.pageNavigation.next}</span>
          <span className="page-navigation-title">{next.label}</span>
          <span className="page-navigation-arrow" aria-hidden="true">
            →
          </span>
        </PageLink>
      )}
    </nav>
  );
}
