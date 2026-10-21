import { notFound } from "next/navigation";
import StaticBlogContent from "@/components/blog/StaticBlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPage, getBlogPosts, getBlogRevision, getBlogTagOptions } from "@/lib/blog";
import { getBlogPageCount } from "@/lib/blog-pagination";
import { blogIndexMetadata } from "@/lib/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;
type Props = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return Array.from({ length: getBlogPageCount(getBlogPosts().length) - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

async function pageNumber({ params }: Props) {
  const { page } = await params;
  if (!/^[1-9]\d{0,6}$/.test(page) || Number(page) < 2) notFound();
  return Number(page);
}

export async function generateMetadata(props: Props) {
  return blogIndexMetadata(await pageNumber(props));
}

export default async function StaticPaginatedBlogPage(props: Props) {
  const currentPage = await pageNumber(props);
  const page = getBlogPage(currentPage);
  if (!page) notFound();
  return (
    <PageTransition>
      <StaticBlogContent
        {...page}
        criteria={{ query: "", tag: null, sort: "latest", language: "en", page: currentPage }}
        tags={getBlogTagOptions()}
        archiveTotal={getBlogPosts().length}
        manifestUrl={`/blog-search/${getBlogRevision()}/manifest.json`}
      />
    </PageTransition>
  );
}
