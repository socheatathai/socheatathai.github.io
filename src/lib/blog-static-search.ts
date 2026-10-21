import { BLOG_PAGE_SIZE, getBlogPageCount } from "./blog-pagination";
import { MAX_BLOG_QUERY_LENGTH, MAX_BLOG_QUERY_TERMS, type BlogQuery } from "./blog-query";
import type { BlogPageData, BlogPostMetadata, BlogPostText } from "@/types/blog";

/** Deliberately excludes source paths, MDX, images, and private catalog fields. */
export type PublicBlogSummary = BlogPostText & {
  slug: string;
  type: "article" | "project";
  date?: string;
  km?: BlogPostText;
};
export type BlogSearchManifest = {
  schemaVersion: 1;
  revision: string;
  totalPosts: number;
  tags: string[];
  chunks: { url: string; count: number; bytes: number; sha256: string }[];
};
export const STATIC_SEARCH_CACHE_CHUNKS = 8;
export const STATIC_SEARCH_MAX_CHUNK_BYTES = 128 * 1024;
export const STATIC_SEARCH_MAX_CHUNK_RECORDS = 128;
const segmenter = new Intl.Segmenter("km", { granularity: "word" });

export function normalizeStaticBlogTag(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}
export function tokenizeStaticBlogText(value: string) {
  return [...segmenter.segment(value.normalize("NFKC").toLowerCase())]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment);
}
export function staticBlogMatches(post: PublicBlogSummary, criteria: BlogQuery, terms: string[]) {
  if (
    criteria.tag &&
    !post.tags.some((tag) => normalizeStaticBlogTag(tag) === normalizeStaticBlogTag(criteria.tag!))
  )
    return false;
  if (!criteria.query) return true;
  if (terms.length === 0 || terms.length > MAX_BLOG_QUERY_TERMS) return false;
  const words = tokenizeStaticBlogText(
    [
      post.title,
      post.description,
      ...post.tags,
      post.slug,
      post.type === "project"
        ? "project projects project notes គម្រោង កំណត់ត្រាគម្រោង"
        : "article articles អត្ថបទ",
      ...(post.km ? [post.km.title, post.km.description, ...post.km.tags] : []),
    ].join(" "),
  );
  return terms.every((term) =>
    words.some((word) => word === term || (term.length >= 2 && word.startsWith(term))),
  );
}

export function compareStaticBlogPosts(criteria: BlogQuery) {
  const collator = new Intl.Collator(criteria.language, { sensitivity: "base" });
  return (a: PublicBlogSummary, b: PublicBlogSummary) => {
    const slug = () => a.slug.localeCompare(b.slug, "en");
    if (criteria.sort === "title")
      return (
        collator.compare(
          (criteria.language === "km" ? a.km : undefined)?.title ?? a.title,
          (criteria.language === "km" ? b.km : undefined)?.title ?? b.title,
        ) || slug()
      );
    if (!a.date && !b.date) return slug();
    if (!a.date) return 1;
    if (!b.date) return -1;
    return (
      (criteria.sort === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) ||
      slug()
    );
  };
}

/** A max heap retains only the requested page's best N candidates while scanning. */
export class BlogTopCandidates {
  private heap: PublicBlogSummary[] = [];
  constructor(
    private limit: number,
    private compare: (a: PublicBlogSummary, b: PublicBlogSummary) => number,
  ) {}
  add(post: PublicBlogSummary) {
    if (this.limit <= 0) return;
    if (this.heap.length < this.limit) {
      this.heap.push(post);
      let child = this.heap.length - 1;
      while (child > 0) {
        const parent = Math.floor((child - 1) / 2);
        if (this.compare(this.heap[child], this.heap[parent]) <= 0) break;
        [this.heap[parent], this.heap[child]] = [this.heap[child], this.heap[parent]];
        child = parent;
      }
    } else if (this.compare(post, this.heap[0]) < 0) {
      this.heap[0] = post;
      let parent = 0;
      while (parent * 2 + 1 < this.heap.length) {
        let child = parent * 2 + 1;
        if (
          child + 1 < this.heap.length &&
          this.compare(this.heap[child + 1], this.heap[child]) > 0
        )
          child += 1;
        if (this.compare(this.heap[child], this.heap[parent]) <= 0) break;
        [this.heap[parent], this.heap[child]] = [this.heap[child], this.heap[parent]];
        parent = child;
      }
    }
  }
  get size() {
    return this.heap.length;
  }
  sorted() {
    return this.heap.sort(this.compare);
  }
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Search cancelled", "AbortError");
}
function validText(value: unknown): value is BlogPostText {
  if (!value || typeof value !== "object") return false;
  const text = value as BlogPostText;
  return (
    typeof text.title === "string" &&
    typeof text.description === "string" &&
    Array.isArray(text.tags) &&
    text.tags.every((tag) => typeof tag === "string")
  );
}
function validSummary(value: unknown): value is PublicBlogSummary {
  if (!validText(value)) return false;
  const post = value as PublicBlogSummary;
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) &&
    (post.type === "article" || post.type === "project") &&
    (post.date === undefined || /^\d{4}-\d{2}-\d{2}$/.test(post.date)) &&
    (post.km === undefined || validText(post.km))
  );
}

export function createStaticBlogSearch(manifestUrl: string, fetcher: typeof fetch = fetch) {
  let manifest: BlogSearchManifest | undefined;
  const cache = new Map<string, PublicBlogSummary[]>();

  async function getManifest(signal?: AbortSignal) {
    abortIfNeeded(signal);
    if (manifest) return manifest;
    const response = await fetcher(manifestUrl, { signal });
    if (!response.ok) throw new Error("The search archive could not be loaded.");
    const value = (await response.json()) as BlogSearchManifest;
    if (
      value.schemaVersion !== 1 ||
      typeof value.revision !== "string" ||
      !Number.isSafeInteger(value.totalPosts) ||
      value.totalPosts < 0 ||
      !Array.isArray(value.tags) ||
      !value.tags.every((tag) => typeof tag === "string") ||
      !Array.isArray(value.chunks) ||
      !value.chunks.every(
        (chunk) =>
          typeof chunk.url === "string" &&
          chunk.url.startsWith(`/blog-search/${value.revision}/`) &&
          !chunk.url.includes("..") &&
          Number.isSafeInteger(chunk.count) &&
          chunk.count > 0 &&
          chunk.count <= STATIC_SEARCH_MAX_CHUNK_RECORDS &&
          Number.isSafeInteger(chunk.bytes) &&
          chunk.bytes > 0 &&
          chunk.bytes <= STATIC_SEARCH_MAX_CHUNK_BYTES &&
          /^[a-f0-9]{64}$/.test(chunk.sha256),
      ) ||
      value.chunks.reduce((sum, chunk) => sum + chunk.count, 0) !== value.totalPosts
    )
      throw new Error("The search archive has an unsupported format.");
    abortIfNeeded(signal);
    manifest = value;
    return value;
  }

  async function chunkPosts(chunk: BlogSearchManifest["chunks"][number], signal?: AbortSignal) {
    abortIfNeeded(signal);
    const cached = cache.get(chunk.url);
    if (cached) {
      cache.delete(chunk.url);
      cache.set(chunk.url, cached);
      return cached;
    }
    const response = await fetcher(chunk.url, { signal });
    if (!response.ok) throw new Error("A search archive chunk could not be loaded.");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== chunk.bytes || buffer.byteLength > STATIC_SEARCH_MAX_CHUNK_BYTES)
      throw new Error("A search archive chunk has an invalid size.");
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
      const hash = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (hash !== chunk.sha256) throw new Error("A search archive chunk failed verification.");
    }
    abortIfNeeded(signal);
    const posts = JSON.parse(new TextDecoder().decode(buffer)) as PublicBlogSummary[];
    if (!Array.isArray(posts) || posts.length !== chunk.count || !posts.every(validSummary))
      throw new Error("A search archive chunk has an unsupported format.");
    cache.set(chunk.url, posts);
    if (cache.size > STATIC_SEARCH_CACHE_CHUNKS) cache.delete(cache.keys().next().value!);
    return posts;
  }

  async function search(criteria: BlogQuery, signal?: AbortSignal): Promise<BlogPageData> {
    const query = criteria.query.normalize("NFKC").trim().slice(0, MAX_BLOG_QUERY_LENGTH);
    const terms = tokenizeStaticBlogText(query);
    const page = Number.isSafeInteger(criteria.page) && criteria.page > 0 ? criteria.page : 1;
    const selected = new BlogTopCandidates(page * BLOG_PAGE_SIZE, compareStaticBlogPosts(criteria));
    let totalPosts = 0;
    const index = await getManifest(signal);
    if (!query || (terms.length > 0 && terms.length <= MAX_BLOG_QUERY_TERMS)) {
      for (const chunk of index.chunks) {
        const posts = await chunkPosts(chunk, signal);
        for (const post of posts) {
          abortIfNeeded(signal);
          if (staticBlogMatches(post, { ...criteria, query }, terms)) {
            totalPosts += 1;
            selected.add(post);
          }
        }
        // Let input and abort events run between chunks, including on cache hits.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        abortIfNeeded(signal);
      }
    }
    const totalPages = getBlogPageCount(totalPosts);
    const currentPage = Math.min(page, totalPages);
    return {
      posts: selected
        .sorted()
        .slice(
          (currentPage - 1) * BLOG_PAGE_SIZE,
          currentPage * BLOG_PAGE_SIZE,
        ) as BlogPostMetadata[],
      currentPage,
      totalPages,
      totalPosts,
    };
  }
  return { search, cacheSize: () => cache.size };
}
