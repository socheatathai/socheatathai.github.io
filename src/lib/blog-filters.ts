import type { BlogPostMetadata, BlogSort } from "@/types/blog";

export const BLOG_SORT_OPTIONS = [
  "latest",
  "oldest",
  "title",
] as const satisfies readonly BlogSort[];

function normalizeTag(tag: string): string {
  return tag.normalize("NFKC").trim().toLowerCase();
}

/** Up to five canonical English tags, ranked by distinct-post count then alphabetically. */
export function getBlogTags(posts: BlogPostMetadata[]): string[] {
  const tags = new Map<string, { label: string; posts: number }>();
  for (const post of posts) {
    const seen = new Set<string>();
    for (const tag of post.tags) {
      const key = normalizeTag(tag);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const existing = tags.get(key);
      if (existing) existing.posts += 1;
      else tags.set(key, { label: tag.trim(), posts: 1 });
    }
  }
  const alphabetical = new Intl.Collator("en");
  return [...tags.values()]
    .sort((a, b) => b.posts - a.posts || alphabetical.compare(a.label, b.label))
    .slice(0, 5)
    .map(({ label }) => label);
}
