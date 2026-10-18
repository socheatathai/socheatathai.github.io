import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import type { BlogPostMetadata } from "@/types/blog";
import { getBlogTags } from "@/lib/blog-filters";
import { createSearchData } from "./search-index";
import { invalid, readDate, readMetadata, readText, validSlug } from "./frontmatter";
import { comparePosts } from "./sort";

const blogDirectory = path.join(process.cwd(), "src", "content", "blog");

export function readBlogFile(filename: string) {
  if (path.isAbsolute(filename) || filename.split(/[\\/]/).includes(".."))
    invalid(filename, "content paths must stay inside the blog collection.");
  const filePath = path.join(blogDirectory, filename);
  if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) return null;

  // Editors may add a UTF-8 BOM or blank lines before the frontmatter fence.
  const source = fs
    .readFileSync(/* turbopackIgnore: true */ filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/^\s*(?=---(?:\r?\n|$))/, "");
  const file = new VFile(source);
  matter(file, { strip: true });
  const frontmatter = file.data.matter;
  const data: Record<string, unknown> =
    frontmatter !== null && typeof frontmatter === "object" && !Array.isArray(frontmatter)
      ? (frontmatter as Record<string, unknown>)
      : {};
  return { data, content: String(file), source };
}

function discoverBlogFiles(directory = blogDirectory, prefix = ""): string[] {
  // Development/publishing discovery is dynamic. Production content is explicitly
  // included by outputFileTracingIncludes, rather than tracing the whole project.
  return fs
    .readdirSync(/* turbopackIgnore: true */ directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const filename = path.posix.join(prefix, entry.name);
      if (entry.isSymbolicLink())
        invalid(filename, "symbolic links are not supported in the content collection.");
      if (entry.isDirectory())
        return discoverBlogFiles(
          path.join(/* turbopackIgnore: true */ directory, entry.name),
          filename,
        );
      return entry.isFile() && entry.name.endsWith(".mdx") ? [filename] : [];
    });
}

/** One publishing pass; bodies are validated/read but are not retained in the index. */
export function buildBlogCatalog() {
  const filenames = discoverBlogFiles();
  const available = new Set(filenames);
  for (const filename of filenames) {
    const translated = filename.endsWith(".km.mdx");
    const basename = path.posix.basename(filename);
    const stem = basename.slice(0, translated ? -7 : -4);
    if (!validSlug.test(stem)) invalid(filename, "use a lowercase hyphenated filename.");
    if (translated && !available.has(`${filename.slice(0, -7)}.mdx`))
      invalid(filename, "the sibling English MDX file is missing.");
  }

  const sources = new Map<string, string>();
  const revision = createHash("sha256");
  const posts = filenames
    .filter((filename) => !filename.endsWith(".km.mdx"))
    .map((filename): BlogPostMetadata => {
      const original = readBlogFile(filename);
      if (!original) invalid(filename, "the English MDX file could not be read.");
      const metadata = readMetadata(original.data, filename);
      const previousSource = sources.get(metadata.slug);
      if (previousSource !== undefined)
        invalid(filename, `slug "${metadata.slug}" is already used by "${previousSource}".`);
      sources.set(metadata.slug, filename);
      revision.update(filename).update("\0").update(original.source).update("\0");

      const translatedFilename = `${filename.slice(0, -4)}.km.mdx`;
      const translated = readBlogFile(translatedFilename);
      if (!translated) return metadata;
      revision.update(translatedFilename).update("\0").update(translated.source).update("\0");
      for (const field of ["slug", "type", "image", "projectUrl", "featured", "updated"]) {
        if (translated.data[field] !== undefined)
          invalid(translatedFilename, `put shared field "${field}" in ${filename} instead.`);
      }
      if (
        translated.data.date !== undefined &&
        readDate(translated.data.date, translatedFilename, "translated date", true) !==
          metadata.date
      ) {
        invalid(translatedFilename, "a translated publication date must match the original.");
      }
      metadata.km = readText(translated.data, translatedFilename);
      return metadata;
    })
    .sort(comparePosts);

  return {
    schemaVersion: 1 as const,
    revision: revision.digest("hex"),
    posts,
    tags: getBlogTags(posts),
    sources: Object.fromEntries(sources),
    search: createSearchData(posts),
  };
}

export type BlogCatalog = ReturnType<typeof buildBlogCatalog>;
