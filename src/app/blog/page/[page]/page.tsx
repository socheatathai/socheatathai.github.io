import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPage, getBlogPosts } from "@/lib/blog";
import { getBlogPageCount, getBlogPageHref } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: getBlogPageCount(getBlogPosts().length) }, (_, index) => ({ page: String(index + 1) }));
}

function readPage(value: string) {
  if (!/^[1-9]\d*$/.test(value)) notFound();
  const result = getBlogPage(Number(value));
  if (!result) notFound();
  return result;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const { currentPage } = readPage(page);
  return pageMetadata(
    currentPage === 1 ? "Blog" : `Blog · Page ${currentPage}`,
    "Project notes, development examples, and tutorials from Thai Socheata.",
    getBlogPageHref(currentPage),
  );
}

export default async function PaginatedBlogPage({ params }: Props) {
  const { page } = await params;
  return <PageTransition><BlogContent {...readPage(page)} allPosts={getBlogPosts()} /></PageTransition>;
}
