import type { Metadata } from "next";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPosts } from "@/lib/blog";
import { getBlogPageCount } from "@/lib/blog-pagination";
import { getBlogPageOrNotFound } from "@/lib/blog/routes";
import { blogIndexMetadata } from "@/lib/metadata";
import type { BlogArchivePageProps } from "@/types/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: getBlogPageCount(getBlogPosts().length) }, (_, index) => ({
    page: String(index + 1),
  }));
}

export async function generateMetadata({ params }: BlogArchivePageProps): Promise<Metadata> {
  const { page } = await params;
  return blogIndexMetadata(getBlogPageOrNotFound(page).currentPage);
}

export default async function PaginatedBlogPage({ params }: BlogArchivePageProps) {
  const { page } = await params;
  return (
    <PageTransition>
      <BlogContent {...getBlogPageOrNotFound(page)} allPosts={getBlogPosts()} />
    </PageTransition>
  );
}
