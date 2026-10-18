import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";
import { getBlogPageCount, getBlogPageHref } from "@/lib/blog-pagination";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/blog/", "/about/", "/contact/"];
  const posts = getBlogPosts();
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}` })),
    ...Array.from({ length: getBlogPageCount(posts.length) - 1 }, (_, index) => ({
      url: `${siteUrl}${getBlogPageHref(index + 2)}`,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}/`,
      ...(post.updated ? { lastModified: post.updated } : {}),
    })),
  ];
}
