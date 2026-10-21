import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogSearchPage, getBlogTagOptions, getBlogPosts } from "@/lib/blog";
import { parseBlogQuery, hasBlogCriteria } from "@/lib/blog-query";
import { blogIndexMetadata } from "@/lib/metadata";
import type { BlogArchivePageProps } from "@/types/routes";

export const dynamic = "force-dynamic";
async function query(props: BlogArchivePageProps) {
  const { page } = await props.params;
  if (!/^[1-9]\d{0,6}$/.test(page)) notFound();
  return parseBlogQuery(await props.searchParams, Number(page));
}
export async function generateMetadata(props: BlogArchivePageProps): Promise<Metadata> {
  const criteria = await query(props);
  return {
    ...blogIndexMetadata(criteria.page),
    ...(hasBlogCriteria(criteria) ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function PaginatedBlogPage(props: BlogArchivePageProps) {
  const criteria = await query(props);
  const page = getBlogSearchPage(criteria);
  if (!page) notFound();
  return (
    <PageTransition>
      <BlogContent
        {...page}
        criteria={criteria}
        tags={getBlogTagOptions()}
        archiveTotal={getBlogPosts().length}
      />
    </PageTransition>
  );
}
