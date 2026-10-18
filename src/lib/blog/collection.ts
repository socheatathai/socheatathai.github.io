import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import type { BlogPost } from "@/types/blog";
import { invalid, readDate, readMetadata, readText, validSlug } from "./frontmatter";
import { comparePosts } from "./sort";

const blogDirectory = path.join(process.cwd(), "src", "content", "blog");

function readBlogFile(filename: string) {
  const filePath = path.join(blogDirectory, filename);
  if (!fs.existsSync(filePath)) return null;

  // Editors may add a UTF-8 BOM or blank lines before the frontmatter fence.
  const source = fs
    .readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/^\s*(?=---(?:\r?\n|$))/, "");
  const file = new VFile(source);
  matter(file, { strip: true });
  const frontmatter = file.data.matter;
  const data: Record<string, unknown> =
    frontmatter !== null && typeof frontmatter === "object" && !Array.isArray(frontmatter)
      ? (frontmatter as Record<string, unknown>)
      : {};
  return { data, content: String(file) };
}

function discoverBlogFiles(directory = blogDirectory, prefix = ""): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const filename = path.posix.join(prefix, entry.name);
      if (entry.isSymbolicLink())
        invalid(filename, "symbolic links are not supported in the content collection.");
      if (entry.isDirectory()) return discoverBlogFiles(path.join(directory, entry.name), filename);
      return entry.isFile() && entry.name.endsWith(".mdx") ? [filename] : [];
    });
}

// Share parsing within a server render; React starts a fresh cache for each request.
export const readBlogCollection = cache(() => {
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
  const posts = filenames
    .filter((filename) => !filename.endsWith(".km.mdx"))
    .map((filename): BlogPost => {
      const original = readBlogFile(filename);
      if (!original) invalid(filename, "the English MDX file could not be read.");
      const metadata = readMetadata(original.data, filename);
      const previousSource = sources.get(metadata.slug);
      if (previousSource !== undefined)
        invalid(filename, `slug "${metadata.slug}" is already used by "${previousSource}".`);
      sources.set(metadata.slug, filename);

      const translatedFilename = `${filename.slice(0, -4)}.km.mdx`;
      const translated = readBlogFile(translatedFilename);
      if (!translated) return { metadata, content: original.content };
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
      return { metadata, content: original.content, kmContent: translated.content };
    })
    .sort((a, b) => comparePosts(a.metadata, b.metadata));

  return {
    bySlug: new Map(posts.map((post) => [post.metadata.slug, post])),
    metadata: posts.map((post) => post.metadata),
  };
});
