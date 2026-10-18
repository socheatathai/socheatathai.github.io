import type { BlogSort } from "@/types/blog";
import type { Language } from "@/types/language";
import { getBlogPageHref } from "./blog-pagination";

export const MAX_BLOG_QUERY_LENGTH = 160;
export const MAX_BLOG_QUERY_TERMS = 8;

export type BlogQuery = {
  query: string;
  tag: string | null;
  sort: BlogSort;
  page: number;
  language: Language;
};

export type BlogSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

export function parseBlogQuery(params: BlogSearchParams, routePage?: number): BlogQuery {
  const page = first(params.page);
  const sort = first(params.sort);
  const tag = first(params.tag)?.normalize("NFKC").trim().slice(0, 100);
  return {
    query: (first(params.q) ?? "").normalize("NFKC").trim().slice(0, MAX_BLOG_QUERY_LENGTH),
    tag: tag || null,
    sort: sort === "oldest" || sort === "title" ? sort : "latest",
    page:
      routePage ??
      (page && /^[1-9]\d{0,6}$/.test(page) && Number.isSafeInteger(Number(page))
        ? Number(page)
        : 1),
    language: first(params.lang) === "km" ? "km" : "en",
  };
}

export function blogQueryHref(query: BlogQuery, page = query.page): string {
  const params = new URLSearchParams();
  if (query.query) params.set("q", query.query);
  if (query.tag) params.set("tag", query.tag);
  if (query.sort !== "latest") params.set("sort", query.sort);
  // Explicit locale keeps shared links and back/forward navigation deterministic.
  params.set("lang", query.language);
  return `${getBlogPageHref(page)}?${params}`;
}

export function hasBlogCriteria(query: BlogQuery): boolean {
  return Boolean(query.query || query.tag || query.sort !== "latest");
}
