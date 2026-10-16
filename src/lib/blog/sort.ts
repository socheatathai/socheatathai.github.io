import type { BlogPostMetadata } from "@/types/blog";

export function comparePosts(a: BlogPostMetadata, b: BlogPostMetadata) {
  return (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug);
}
