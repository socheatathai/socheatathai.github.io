import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { getBlogPostOrNotFound, getBlogMetadataOrNotFound } from "@/lib/blog/routes";
import { blogPostMetadata } from "@/lib/metadata";
import type { BlogPostPageProps } from "@/types/routes";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  // Render and cache articles on first visit rather than compiling 50,000 at every build.
  return [];
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMetadata(getBlogMetadataOrNotFound(slug));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <PageTransition key={slug}>
      <BlogPostContent post={getBlogPostOrNotFound(slug)} />
    </PageTransition>
  );
}
