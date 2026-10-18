import type { BlogPostMetadata } from "@/types/blog";
import { getBlogPageCount, getBlogPageHref } from "@/lib/blog-pagination";

export const SITEMAP_SIZE = 10_000;
export const sitemapPages = ["/", "/blog/", "/about/", "/contact/"];
export function sitemapCount(posts: number) {
  return Math.ceil((sitemapPages.length + getBlogPageCount(posts) - 1 + posts) / SITEMAP_SIZE);
}
export function sitemapEntries(posts: BlogPostMetadata[], shard: number) {
  if (!Number.isSafeInteger(shard) || shard < 0 || shard >= sitemapCount(posts.length)) return null;
  const archiveCount = getBlogPageCount(posts.length) - 1;
  const total = sitemapPages.length + archiveCount + posts.length;
  const entries: { path: string; updated?: string }[] = [];
  for (let i = shard * SITEMAP_SIZE; i < Math.min((shard + 1) * SITEMAP_SIZE, total); i++) {
    if (i < sitemapPages.length) entries.push({ path: sitemapPages[i] });
    else if (i < sitemapPages.length + archiveCount)
      entries.push({ path: getBlogPageHref(i - sitemapPages.length + 2) });
    else {
      const post = posts[i - sitemapPages.length - archiveCount];
      entries.push({ path: `/blog/${post.slug}/`, updated: post.updated });
    }
  }
  return entries;
}
export function xmlEscape(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!,
  );
}
