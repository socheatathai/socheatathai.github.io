import type { BlogPostMetadata } from "./blog";

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/** Match every search term against both languages without changing archive order. */
export function searchBlogPosts(posts: BlogPostMetadata[], query: string): BlogPostMetadata[] {
  const terms = normalizeSearchText(query).trim().split(/\s+/u).filter(Boolean);
  if (terms.length === 0) return posts;

  return posts.filter((post) => {
    const text = normalizeSearchText([
      post.title, post.description, ...post.tags, post.slug,
      post.type === "project" ? "project projects project notes គម្រោង កំណត់ត្រាគម្រោង" : "article articles អត្ថបទ",
      ...(post.km ? [post.km.title, post.km.description, ...post.km.tags] : []),
    ].join(" "));
    return terms.every((term) => text.includes(term));
  });
}
