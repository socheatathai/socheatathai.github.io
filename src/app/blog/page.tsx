import type { Metadata } from "next";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPage, getBlogPosts } from "@/lib/blog";
import { blogIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = blogIndexMetadata();

export default function BlogPage() {
  return (
    <PageTransition>
      <BlogContent {...getBlogPage(1)!} allPosts={getBlogPosts()} />
    </PageTransition>
  );
}
