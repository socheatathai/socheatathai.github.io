import type { BlogPageData, BlogPost, BlogPostMetadata } from "@/types/blog";
import { BLOG_PAGE_SIZE, getBlogPageCount } from "@/lib/blog-pagination";
import { readBlogCollection } from "./blog/collection";
import { validSlug } from "./blog/frontmatter";
import { comparePosts } from "./blog/sort";

/** Read only trusted local MDX; public slugs never become filesystem paths. */
export function getBlogPost(slug: string): BlogPost | null {
  if (!validSlug.test(slug)) return null;
  return readBlogCollection().bySlug.get(slug) ?? null;
}

export function getBlogPosts(): BlogPostMetadata[] {
  return [...readBlogCollection().metadata];
}

export function getFeaturedProjects(): BlogPostMetadata[] {
  return getBlogPosts()
    .filter((post) => post.type === "project" && post.featured)
    .slice(0, 3);
}

export function getRelatedBlogPosts(slug: string): BlogPostMetadata[] {
  const current = getBlogPost(slug)?.metadata;
  if (!current) return [];

  const tags = new Set(current.tags.map((tag) => tag.trim().toLowerCase()));
  return getBlogPosts()
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      sharedTags: new Set(
        post.tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tags.has(tag)),
      ).size,
    }))
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        Number(b.post.type === current.type) - Number(a.post.type === current.type) ||
        comparePosts(a.post, b.post),
    )
    .slice(0, 3)
    .map(({ post }) => post);
}

export function getBlogPage(page: number): BlogPageData | null {
  const posts = getBlogPosts();
  const totalPages = getBlogPageCount(posts.length);
  if (!Number.isSafeInteger(page) || page < 1 || page > totalPages) return null;
  return {
    posts: posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE),
    currentPage: page,
    totalPages,
    totalPosts: posts.length,
  };
}

export function getBlogSlugs(): string[] {
  return getBlogPosts().map((post) => post.slug);
}
