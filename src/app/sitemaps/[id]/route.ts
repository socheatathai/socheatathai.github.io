import { notFound } from "next/navigation";
import { getBlogPosts } from "@/lib/blog";
import { sitemapEntries, xmlEscape } from "@/lib/blog/sitemap";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^(0|[1-9]\d*)\.xml$/.test(id)) notFound();
  const entries = sitemapEntries(getBlogPosts(), Number(id.slice(0, -4)));
  if (!entries) notFound();
  const urls = entries
    .map(
      ({ path, updated }) =>
        `<url><loc>${xmlEscape(`${siteUrl}${path}`)}</loc>${updated ? `<lastmod>${updated}</lastmod>` : ""}</url>`,
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    },
  );
}
