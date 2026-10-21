import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogSearchPage, getBlogTagOptions, getBlogPosts } from "@/lib/blog";
import { hasBlogCriteria, parseBlogQuery, type BlogSearchParams } from "@/lib/blog-query";
import { blogIndexMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<BlogSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const criteria = parseBlogQuery(await searchParams);
  return {
    ...blogIndexMetadata(criteria.page),
    ...(hasBlogCriteria(criteria) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const criteria = parseBlogQuery(await searchParams);
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
