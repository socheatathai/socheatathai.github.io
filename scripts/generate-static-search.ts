import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { BlogPostMetadata, BlogPostText } from "../src/types/blog";

const MAX_CHUNK_RECORDS = 128;
const MAX_CHUNK_BYTES = 128 * 1024;
type PublicSummary = Pick<
  BlogPostMetadata,
  "slug" | "title" | "description" | "tags" | "type" | "date" | "km"
>;
type Chunk = { url: string; count: number; bytes: number; sha256: string };
type Manifest = {
  schemaVersion: 1;
  revision: string;
  totalPosts: number;
  tags: string[];
  chunks: Chunk[];
};

function publicText(value: unknown): BlogPostText {
  if (!value || typeof value !== "object") throw new Error("Invalid public post text");
  const { title, description, tags } = value as BlogPostText;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== "string" || !tag.trim())
  )
    throw new Error("Invalid public post title, description or tags");
  return { title, description, tags: [...tags] };
}

function publicSummary(value: unknown): PublicSummary {
  const text = publicText(value);
  const post = value as BlogPostMetadata;
  if (
    typeof post.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) ||
    !["article", "project"].includes(post.type) ||
    (post.date !== undefined &&
      (typeof post.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)))
  )
    throw new Error("Invalid public post slug, type or date");
  return {
    slug: post.slug,
    ...text,
    type: post.type,
    ...(post.date !== undefined ? { date: post.date } : {}),
    ...(post.km !== undefined ? { km: publicText(post.km) } : {}),
  };
}

async function ensureDirectory(directory: string) {
  try {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error(`Static search directory must not be a symlink: ${directory}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(directory, { recursive: true });
  }
}

async function publish(filename: string, contents: string) {
  const temporary = `${filename}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: "wx" });
    await rename(temporary, filename);
  } finally {
    await rm(temporary, { force: true });
  }
}

/** Publish only reviewed summaries; the private engine and source map stay on disk. */
export async function generateStaticSearch({
  directory = path.resolve("out"),
  catalogFilename = path.resolve(".generated/blog-index.json"),
}: { directory?: string; catalogFilename?: string } = {}): Promise<Manifest> {
  const catalog = JSON.parse(await readFile(catalogFilename, "utf8")) as {
    schemaVersion?: unknown;
    revision?: unknown;
    posts?: unknown;
    tags?: unknown;
  };
  if (
    catalog?.schemaVersion !== 1 ||
    typeof catalog.revision !== "string" ||
    !/^[a-f0-9]{64}$/.test(catalog.revision) ||
    !Array.isArray(catalog.posts) ||
    !Array.isArray(catalog.tags) ||
    catalog.tags.some((tag) => typeof tag !== "string" || !tag.trim())
  )
    throw new Error("Invalid private blog catalog. Run npm run index:blog first.");

  const output = path.resolve(directory);
  const searchDirectory = path.join(output, "blog-search");
  const revisionDirectory = path.join(searchDirectory, catalog.revision);
  for (const target of [output, searchDirectory, revisionDirectory]) await ensureDirectory(target);
  const prefix = `/blog-search/${catalog.revision}/`;
  const manifest: Manifest = {
    schemaVersion: 1,
    revision: catalog.revision,
    totalPosts: catalog.posts.length,
    tags: [...catalog.tags] as string[],
    chunks: [],
  };
  let records: string[] = [];
  let bytes = 2; // Array brackets; each subsequent record adds a comma.
  async function flush() {
    if (!records.length) return;
    const body = `[${records.join(",")}]`;
    const name = `chunk-${String(manifest.chunks.length).padStart(4, "0")}.json`;
    await publish(path.join(revisionDirectory, name), body);
    manifest.chunks.push({
      url: prefix + name,
      count: records.length,
      bytes: Buffer.byteLength(body),
      sha256: createHash("sha256").update(body).digest("hex"),
    });
    records = [];
    bytes = 2;
  }
  for (const post of catalog.posts) {
    const summary = publicSummary(post);
    const json = JSON.stringify(summary);
    const size = Buffer.byteLength(json);
    if (size + 2 > MAX_CHUNK_BYTES)
      throw new Error(`Public summary "${summary.slug}" exceeds the 128 KiB chunk limit`);
    if (
      records.length >= MAX_CHUNK_RECORDS ||
      bytes + size + Number(records.length > 0) > MAX_CHUNK_BYTES
    )
      await flush();
    bytes += size + Number(records.length > 0);
    records.push(json);
  }
  await flush();
  // Publishing the manifest last prevents readers discovering an incomplete chunk set.
  await publish(path.join(revisionDirectory, "manifest.json"), JSON.stringify(manifest));
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length > 3) {
    console.error("Usage: node --import tsx scripts/generate-static-search.ts [outputDirectory]");
    process.exitCode = 1;
  } else
    generateStaticSearch({ directory: process.argv[2] ? path.resolve(process.argv[2]) : undefined })
      .then((manifest) =>
        console.log(
          `Public blog search: ${manifest.totalPosts} summaries in ${manifest.chunks.length} bounded chunks; revision ${manifest.revision}.`,
        ),
      )
      .catch((error: Error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
}
