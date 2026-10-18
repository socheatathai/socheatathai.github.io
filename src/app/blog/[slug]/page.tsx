import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { getBlogSlugs } from "@/lib/blog";
import { getBlogPostOrNotFound } from "@/lib/blog/routes";
import { blogPostMetadata } from "@/lib/metadata";
import type { BlogPostPageProps } from "@/types/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMetadata(getBlogPostOrNotFound(slug).metadata);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <PageTransition key={slug}>
      <BlogPostContent post={getBlogPostOrNotFound(slug)} />
    </PageTransition>
  );
}
