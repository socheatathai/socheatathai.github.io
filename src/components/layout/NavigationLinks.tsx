"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { getNavigationItems, normalizePathname } from "@/lib/navigation";
import Link from "./PageLink";
import { LayoutIcon } from "./icons";
import type { NavigationActionProps } from "./types";

export default function NavigationLinks({ onNavigate }: NavigationActionProps) {
  const pathname = usePathname();
  const currentPath = normalizePathname(pathname);
  const { content } = useLanguage();
  const items = getNavigationItems(content.nav);
  const currentPageIndex = items.findIndex(({ href }) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href),
  );

  return (
    <>
      {items.map(({ id, href, label }, index) => {
        const exactPage = currentPath === href;
        const active = exactPage || (href !== "/" && currentPath.startsWith(href));
        const returningToSection = active && !exactPage;
        return (
          <Link
            key={href}
            href={href}
            direction={index < currentPageIndex || returningToSection ? "back" : "forward"}
            className={`nav-link${active ? " is-active" : ""}`}
            aria-current={active ? (exactPage ? "page" : "location") : undefined}
            onClick={onNavigate}
          >
            <LayoutIcon name={id} />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}
