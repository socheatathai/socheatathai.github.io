import { getBlogPosts } from "@/lib/blog";
import { sitemapCount, xmlEscape } from "@/lib/blog/sitemap";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export function GET() {
  const locations = Array.from(
    { length: sitemapCount(getBlogPosts().length) },
    (_, id) => `<sitemap><loc>${xmlEscape(`${siteUrl}/sitemaps/${id}.xml`)}</loc></sitemap>`,
  ).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations}</sitemapindex>`,
    {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    },
  );
}
