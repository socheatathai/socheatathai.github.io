const pages = [
  { id: "home", href: "/" },
  { id: "blog", href: "/blog/" },
  { id: "about", href: "/about/" },
  { id: "contact", href: "/contact/" },
] as const;

export type NavigationId = (typeof pages)[number]["id"];

export function getNavigationItems(labels: Record<NavigationId, string>) {
  return pages.map((page) => ({ ...page, label: labels[page.id] }));
}

export function normalizePathname(pathname: string): string {
  return `${pathname.replace(/\/+$/, "")}/`;
}
