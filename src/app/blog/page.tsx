import type { Metadata } from "next";
import BlogContent from "@/components/blog/BlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPage, getBlogPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Blog",
  "Project notes, development examples, and tutorials from Thai Socheata.",
  "/blog/",
);

export default function BlogPage() {
  return (
    <PageTransition><BlogContent {...getBlogPage(1)!} allPosts={getBlogPosts()} /></PageTransition>
  );
}
