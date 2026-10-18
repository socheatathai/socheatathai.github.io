import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { BlogPost, BlogPostMetadata } from "@/types/blog";
import type { BlogQuery } from "@/lib/blog-query";
import { buildBlogCatalog, readBlogFile, type BlogCatalog } from "./blog/collection";
import { createBlogSearch } from "./blog/search-index";
import { validSlug } from "./blog/frontmatter";

function readPublishedCatalog(): BlogCatalog {
  const filename = path.join(process.cwd(), ".generated", "blog-index.json");
  if (!fs.existsSync(/* turbopackIgnore: true */ filename))
    throw new Error("Missing private blog index. Run npm run index:blog before building/starting.");
  const catalog = JSON.parse(
    fs.readFileSync(/* turbopackIgnore: true */ filename, "utf8"),
  ) as BlogCatalog;
  if (
    catalog.schemaVersion !== 1 ||
    !Array.isArray(catalog.posts) ||
    !Array.isArray(catalog.tags) ||
    !catalog.search ||
    !catalog.sources
  )
    throw new Error("Unsupported blog index. Regenerate it with npm run index:blog.");
  return catalog;
}

function createRepository() {
  const { search: serialized, ...catalog } =
    process.env.NODE_ENV === "development" ? buildBlogCatalog() : readPublishedCatalog();
  const search = createBlogSearch(catalog.posts, serialized, catalog.tags);
  const bySlug = new Map(catalog.posts.map((post) => [post.slug, post]));
  const slugs = catalog.posts.map((post) => post.slug);
  const featured = catalog.posts
    .filter((post) => post.type === "project" && post.featured)
    .slice(0, 3);
  return { catalog, search, bySlug, slugs, featured };
}

let published: ReturnType<typeof createRepository> | undefined;
// Hydrate once per production process, not once per request. Dev edits are read per render.
const repository = cache(() => {
  if (process.env.NODE_ENV === "development") return createRepository();
  return (published ??= createRepository());
});

export function getBlogMetadata(slug: string): BlogPostMetadata | null {
  return validSlug.test(slug) ? (repository().bySlug.get(slug) ?? null) : null;
}

export const getBlogPost = cache((slug: string): BlogPost | null => {
  const metadata = getBlogMetadata(slug);
  if (!metadata) return null;
  const filename = repository().catalog.sources[slug];
  if (typeof filename !== "string")
    throw new Error(`Published blog source entry is missing: ${slug}`);
  const original = readBlogFile(filename);
  if (!original) throw new Error(`Published blog source is missing: ${filename}`);
  const translated = metadata.km ? readBlogFile(`${filename.slice(0, -4)}.km.mdx`) : null;
  if (metadata.km && !translated) throw new Error(`Published translation is missing: ${filename}`);
  return { metadata, content: original.content, kmContent: translated?.content };
});

export function getBlogPosts(): BlogPostMetadata[] {
  return repository().catalog.posts;
}

export function getFeaturedProjects() {
  return repository().featured;
}

export function getRelatedBlogPosts(slug: string) {
  return repository().search.related(slug);
}

export function getBlogSearchPage(criteria: BlogQuery) {
  return repository().search.page(criteria);
}

export function getBlogTagOptions() {
  return repository().search.tags;
}

export function getBlogPage(page: number) {
  return getBlogSearchPage({ query: "", tag: null, sort: "latest", language: "en", page });
}

export function getBlogListingPage(slug: string) {
  return repository().search.listingPages.get(slug) ?? 1;
}

export function getBlogSlugs() {
  return repository().slugs;
}
