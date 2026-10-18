import MiniSearch, { type Options } from "minisearch";
import type { BlogPostMetadata, BlogPageData } from "@/types/blog";
import type { BlogQuery } from "@/lib/blog-query";
import { MAX_BLOG_QUERY_TERMS } from "@/lib/blog-query";
import { BLOG_PAGE_SIZE, getBlogPageCount } from "@/lib/blog-pagination";
import { localizedBlogText } from "@/lib/blog-text";
import { getBlogTags } from "@/lib/blog-filters";
import { comparePosts } from "./sort";

type SearchDocument = { id: number; text: string };
const segmenter = new Intl.Segmenter("km", { granularity: "word" });

export function normalizeBlogTag(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}

export function tokenizeBlogText(value: string): string[] {
  return [...segmenter.segment(value.normalize("NFKC").toLowerCase())]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment);
}

export const blogSearchOptions: Options<SearchDocument> = {
  fields: ["text"],
  tokenize: tokenizeBlogText,
  processTerm: (term) => term.normalize("NFKC").toLowerCase(),
  searchOptions: { combineWith: "AND", prefix: (term) => term.length >= 2 },
};

export function createSearchData(posts: BlogPostMetadata[]) {
  const engine = new MiniSearch<SearchDocument>(blogSearchOptions);
  engine.addAll(
    posts.map((post, id) => ({
      id,
      text: [
        post.title,
        post.description,
        ...post.tags,
        post.slug,
        post.type === "project"
          ? "project projects project notes គម្រោង កំណត់ត្រាគម្រោង"
          : "article articles អត្ថបទ",
        ...(post.km ? [post.km.title, post.km.description, ...post.km.tags] : []),
      ].join(" "),
    })),
  );
  return engine.toJSON();
}

type SearchData = ReturnType<typeof createSearchData>;

/** Server-resident index. No document corpus or search implementation is sent to clients. */
export function createBlogSearch(
  posts: BlogPostMetadata[],
  searchData?: SearchData,
  tagOptions?: string[],
) {
  const engine = MiniSearch.loadJS<SearchDocument>(
    searchData ?? createSearchData(posts),
    blogSearchOptions,
  );
  const ids = posts.map((_, id) => id);
  const tags = tagOptions ?? getBlogTags(posts);
  const tagIds = new Map<string, Set<number>>();
  for (const [id, post] of posts.entries()) {
    for (const tag of new Set(post.tags.map(normalizeBlogTag))) {
      const bucket = tagIds.get(tag) ?? new Set<number>();
      bucket.add(id);
      tagIds.set(tag, bucket);
    }
  }
  const slugOrder = (a: number, b: number) => posts[a].slug.localeCompare(posts[b].slug, "en");
  const byDate = (oldest: boolean) => (a: number, b: number) => {
    if (!posts[a].date && !posts[b].date) return slugOrder(a, b);
    if (!posts[a].date) return 1;
    if (!posts[b].date) return -1;
    return (
      (oldest
        ? posts[a].date!.localeCompare(posts[b].date!)
        : posts[b].date!.localeCompare(posts[a].date!)) || slugOrder(a, b)
    );
  };
  const titleOrder = (language: "en" | "km") => {
    const collator = new Intl.Collator(language, { sensitivity: "base" });
    return (a: number, b: number) =>
      collator.compare(
        localizedBlogText(posts[a], language).title,
        localizedBlogText(posts[b], language).title,
      ) || slugOrder(a, b);
  };
  const orders = {
    latest: ids.toSorted(byDate(false)),
    oldest: ids.toSorted(byDate(true)),
    en: ids.toSorted(titleOrder("en")),
    km: ids.toSorted(titleOrder("km")),
  };
  const ranks = Object.fromEntries(
    Object.entries(orders).map(([key, order]) => {
      const rank = new Uint32Array(posts.length);
      order.forEach((id, position) => (rank[id] = position));
      return [key, rank];
    }),
  );
  // Bounded LRU caches result IDs, never rendered HTML or an unbounded collection of queries.
  const cache = new Map<string, number[]>();
  // Related results rank only the eight newest candidates for each tag/type.
  // Older globally optimal matches can be omitted; work scales with this post's
  // reviewed tag count, never with the complete archive on each request.
  const relatedBuckets = new Map<string, number[]>();
  for (const id of orders.latest) {
    for (const key of [
      `type:${posts[id].type}`,
      ...new Set(posts[id].tags.map((tag) => `tag:${normalizeBlogTag(tag)}`)),
    ]) {
      const bucket = relatedBuckets.get(key) ?? [];
      if (bucket.length < 8) bucket.push(id);
      relatedBuckets.set(key, bucket);
    }
  }

  function matchingIds(criteria: BlogQuery): number[] {
    const orderKey = criteria.sort === "title" ? criteria.language : criteria.sort;
    if (!criteria.query && !criteria.tag) return orders[orderKey];
    const key = JSON.stringify([criteria.query, criteria.tag, orderKey]);
    const cached = cache.get(key);
    if (cached) {
      cache.delete(key);
      cache.set(key, cached);
      return cached;
    }
    const tagged = criteria.tag ? tagIds.get(normalizeBlogTag(criteria.tag)) : undefined;
    let matches: number[];
    if (criteria.tag && !tagged) matches = [];
    else if (criteria.query) {
      const terms = tokenizeBlogText(criteria.query);
      // Reject over-complex searches rather than quietly dropping terms or expanding wildcards.
      matches =
        terms.length === 0 || terms.length > MAX_BLOG_QUERY_TERMS
          ? []
          : engine
              .search(criteria.query, {
                ...(tagged ? { filter: (result) => tagged.has(Number(result.id)) } : {}),
              })
              .map((result) => Number(result.id));
    } else matches = [...(tagged ?? [])];
    matches.sort((a, b) => ranks[orderKey][a] - ranks[orderKey][b]);
    cache.set(key, matches);
    if (cache.size > 16) cache.delete(cache.keys().next().value!);
    return matches;
  }

  function page(criteria: BlogQuery): BlogPageData | null {
    if (!Number.isSafeInteger(criteria.page) || criteria.page < 1) return null;
    const matches = matchingIds(criteria);
    const totalPages = getBlogPageCount(matches.length);
    if (criteria.page > totalPages) return null;
    return {
      posts: matches
        .slice((criteria.page - 1) * BLOG_PAGE_SIZE, criteria.page * BLOG_PAGE_SIZE)
        .map((id) => {
          const { slug, title, description, tags, type, date, km } = posts[id];
          return { slug, title, description, tags, type, date, km };
        }),
      currentPage: criteria.page,
      totalPages,
      totalPosts: matches.length,
    };
  }

  function related(slug: string): BlogPostMetadata[] {
    const id = bySlug.get(slug);
    if (id === undefined) return [];
    const current = posts[id];
    const currentTags = new Set(current.tags.map(normalizeBlogTag));
    const candidates = new Set([
      ...(relatedBuckets.get("type:article") ?? []),
      ...(relatedBuckets.get("type:project") ?? []),
      ...[...currentTags].flatMap((tag) => relatedBuckets.get(`tag:${tag}`) ?? []),
    ]);
    candidates.delete(id);
    const overlap = (id: number) =>
      new Set(posts[id].tags.map(normalizeBlogTag).filter((tag) => currentTags.has(tag))).size;
    return [...candidates]
      .map((candidate) => ({ candidate, shared: overlap(candidate) }))
      .sort(
        (a, b) =>
          b.shared - a.shared ||
          Number(posts[b.candidate].type === current.type) -
            Number(posts[a.candidate].type === current.type) ||
          comparePosts(posts[a.candidate], posts[b.candidate]),
      )
      .slice(0, 3)
      .map(({ candidate }) => posts[candidate]);
  }
  const bySlug = new Map(posts.map((post, id) => [post.slug, id]));
  const listingPages = new Map(
    orders.latest.map((id, i) => [posts[id].slug, Math.floor(i / BLOG_PAGE_SIZE) + 1]),
  );
  return { page, related, tags, bySlug, listingPages, cacheSize: () => cache.size };
}
