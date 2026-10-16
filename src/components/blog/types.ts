import type { ReactNode } from "react";
import type { BlogPageData, BlogPostMetadata } from "@/types/blog";

export type BlogContentProps = BlogPageData & {
  allPosts: BlogPostMetadata[];
};

export type BlogPaginationProps = Omit<BlogPageData, "posts">;

export type BlogArticleProps = {
  metadata: BlogPostMetadata;
  children: ReactNode;
  khmerContent?: ReactNode;
  backHref?: string;
};
