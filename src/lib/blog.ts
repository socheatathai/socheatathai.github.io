import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import { BLOG_PAGE_SIZE, getBlogPageCount } from "@/lib/blog-pagination";

export type BlogPostText = {
  title: string;
  description: string;
  tags: string[];
};

export type BlogPostMetadata = BlogPostText & {
  slug: string;
  type: "project" | "article";
  date?: string;
  image?: string;
  projectUrl?: string;
  featured?: boolean;
  km?: BlogPostText;
};

export type BlogPost = {
  metadata: BlogPostMetadata;
  content: string;
  kmContent?: string;
};

const blogDirectory = path.join(process.cwd(), "src", "content", "blog");
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invalid(filename: string, message: string): never {
  throw new Error(`Blog file "${filename}": ${message}`);
}

function readBlogFile(filename: string) {
  const filePath = path.join(blogDirectory, filename);
  if (!fs.existsSync(filePath)) return null;

  // Editors may add a UTF-8 BOM or blank lines before the frontmatter fence.
  const source = fs.readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/^\s*(?=---(?:\r?\n|$))/, "");
  const file = new VFile(source);
  matter(file, { strip: true });
  const frontmatter = file.data.matter;
  const data: Record<string, unknown> = frontmatter !== null && typeof frontmatter === "object" && !Array.isArray(frontmatter)
    ? frontmatter as Record<string, unknown>
    : {};
  return { data, content: String(file) };
}

function readText(data: Record<string, unknown>, filename: string): BlogPostText {
  if (typeof data.title !== "string" || !data.title.trim() || typeof data.description !== "string" || !data.description.trim()) {
    invalid(filename, "title and description must be nonempty strings.");
  }
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string" || !tag.trim()))) {
    invalid(filename, "tags must be an array of nonempty strings.");
  }
  return { title: data.title, description: data.description, tags: (data.tags ?? []) as string[] };
}

function readDate(value: unknown, filename: string, required: boolean): string | undefined {
  if (value === undefined && !required) return undefined;
  const date = value instanceof Date && !Number.isNaN(value.valueOf()) ? value.toISOString().slice(0, 10) : value;
  if (
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    invalid(filename, "date must be a valid YYYY-MM-DD date (required for articles).");
  }
  return date;
}

function readMetadata(data: Record<string, unknown>, filename: string): BlogPostMetadata {
  const slug = data.slug;
  if (typeof slug !== "string" || !validSlug.test(slug)) invalid(filename, "slug is required and must contain lowercase words separated by hyphens.");
  const text = readText(data, filename);
  const type = data.type === undefined ? "article" : data.type;
  if (type !== "project" && type !== "article") invalid(filename, "type must be project or article.");
  const date = readDate(data.date, filename, type === "article");

  if (data.featured !== undefined && typeof data.featured !== "boolean") invalid(filename, "featured must be true or false.");

  const image = data.image;
  if (image !== undefined && (typeof image !== "string" || !image.startsWith("/images/") || path.posix.normalize(image) !== image)) {
    invalid(filename, "image must be a local /images/ path without traversal segments.");
  }
  if (typeof image === "string") {
    const imagePath = path.join(process.cwd(), "public", image);
    if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) invalid(filename, `image must reference an existing file: ${image}.`);
  }

  const projectUrl = data.projectUrl;
  if (projectUrl !== undefined) {
    if (typeof projectUrl !== "string" || !URL.canParse(projectUrl) || !["https:", "http:"].includes(new URL(projectUrl).protocol)) {
      invalid(filename, "projectUrl must be an absolute HTTP or HTTPS URL.");
    }
  }
  if (type === "project" && (!image || !projectUrl)) invalid(filename, "project posts require image and projectUrl.");

  return {
    ...text, slug, type, date,
    ...(image !== undefined ? { image: image as string } : {}),
    ...(projectUrl !== undefined ? { projectUrl: projectUrl as string } : {}),
    ...(data.featured !== undefined ? { featured: data.featured as boolean } : {}),
  };
}

function comparePosts(a: BlogPostMetadata, b: BlogPostMetadata) {
  return (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug);
}

function discoverBlogFiles(directory = blogDirectory, prefix = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const filename = path.posix.join(prefix, entry.name);
      if (entry.isSymbolicLink()) invalid(filename, "symbolic links are not supported in the content collection.");
      if (entry.isDirectory()) return discoverBlogFiles(path.join(directory, entry.name), filename);
      return entry.isFile() && entry.name.endsWith(".mdx") ? [filename] : [];
    });
}

// Share parsing within a server render; React starts a fresh cache for each request.
const readBlogCollection = cache(() => {
  const filenames = discoverBlogFiles();
  const available = new Set(filenames);
  for (const filename of filenames) {
    const translated = filename.endsWith(".km.mdx");
    const basename = path.posix.basename(filename);
    const stem = basename.slice(0, translated ? -7 : -4);
    if (!validSlug.test(stem)) invalid(filename, "use a lowercase hyphenated filename.");
    if (translated && !available.has(`${filename.slice(0, -7)}.mdx`)) invalid(filename, "the sibling English MDX file is missing.");
  }

  const sources = new Map<string, string>();
  const posts = filenames
    .filter((filename) => !filename.endsWith(".km.mdx"))
    .map((filename): BlogPost => {
      const original = readBlogFile(filename);
      if (!original) invalid(filename, "the English MDX file could not be read.");
      const metadata = readMetadata(original.data, filename);
      const previousSource = sources.get(metadata.slug);
      if (previousSource !== undefined) invalid(filename, `slug "${metadata.slug}" is already used by "${previousSource}".`);
      sources.set(metadata.slug, filename);

      const translatedFilename = `${filename.slice(0, -4)}.km.mdx`;
      const translated = readBlogFile(translatedFilename);
      if (!translated) return { metadata, content: original.content };
      for (const field of ["slug", "type", "image", "projectUrl", "featured"]) {
        if (translated.data[field] !== undefined) invalid(translatedFilename, `put shared field "${field}" in ${filename} instead.`);
      }
      if (translated.data.date !== undefined && readDate(translated.data.date, translatedFilename, true) !== metadata.date) {
        invalid(translatedFilename, "a translated publication date must match the original.");
      }
      metadata.km = readText(translated.data, translatedFilename);
      return { metadata, content: original.content, kmContent: translated.content };
    })
    .sort((a, b) => comparePosts(a.metadata, b.metadata));

  return {
    bySlug: new Map(posts.map((post) => [post.metadata.slug, post])),
    metadata: posts.map((post) => post.metadata),
  };
});

/** Read only trusted local MDX; public slugs never become filesystem paths. */
export function getBlogPost(slug: string): BlogPost | null {
  if (!validSlug.test(slug)) return null;
  return readBlogCollection().bySlug.get(slug) ?? null;
}

export function getBlogPosts(): BlogPostMetadata[] {
  return [...readBlogCollection().metadata];
}

export function getFeaturedProjects(): BlogPostMetadata[] {
  return getBlogPosts().filter((post) => post.type === "project" && post.featured).slice(0, 3);
}

export function getRelatedBlogPosts(slug: string): BlogPostMetadata[] {
  const current = getBlogPost(slug)?.metadata;
  if (!current) return [];

  const tags = new Set(current.tags.map((tag) => tag.trim().toLowerCase()));
  return getBlogPosts()
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      sharedTags: new Set(post.tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tags.has(tag))).size,
    }))
    .sort((a, b) => b.sharedTags - a.sharedTags
      || Number(b.post.type === current.type) - Number(a.post.type === current.type)
      || comparePosts(a.post, b.post))
    .slice(0, 3)
    .map(({ post }) => post);
}

export function getBlogPage(page: number) {
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
