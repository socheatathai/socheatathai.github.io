import type { MetadataRoute } from "next";
import { getBlogSlugs } from "@/lib/blog";
import { getBlogPageCount, getBlogPageHref } from "@/lib/blog-pagination";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/blog/", "/about/", "/contact/"];
  const slugs = getBlogSlugs();
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}` })),
    ...Array.from({ length: getBlogPageCount(slugs.length) - 1 }, (_, index) => ({ url: `${siteUrl}${getBlogPageHref(index + 2)}` })),
    ...slugs.map((slug) => ({ url: `${siteUrl}/blog/${slug}/` })),
  ];
}
