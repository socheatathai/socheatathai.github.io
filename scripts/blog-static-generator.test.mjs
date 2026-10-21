import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import generator from "./generate-static-search.ts";

const { generateStaticSearch } = generator;

const revision = "a".repeat(64);
const post = (index, description = "Public summary") => ({
  slug: `post-${index}`,
  title: `Post ${index}`,
  description,
  tags: ["TypeScript"],
  type: "article",
  date: "2026-10-20",
  image: "/images/private-extra.png",
  projectUrl: "https://private-extra.example/",
  content: "PRIVATE_BODY",
  source: "PRIVATE_SOURCE.mdx",
  km: {
    title: "ចំណងជើង",
    description: "សេចក្ដីសង្ខេប",
    tags: ["TypeScript"],
    secret: "PRIVATE_TRANSLATION_EXTRA",
  },
});

async function fixture(context, posts, selectedRevision = revision) {
  const root = await mkdtemp(path.join(tmpdir(), "static-blog-generator-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const catalogFilename = path.join(root, "private-index.json");
  const body = JSON.stringify({
    schemaVersion: 1,
    revision: selectedRevision,
    posts,
    tags: ["TypeScript"],
    search: { privateEngine: "PRIVATE_SEARCH_ENGINE" },
    sources: { "post-0": "PRIVATE_SOURCE_MAP.mdx" },
  });
  await writeFile(catalogFilename, body);
  return { root, options: { directory: path.join(root, "out"), catalogFilename }, body };
}

test("public search publication strips private fields and preserves the private catalog", async (context) => {
  const { root, options, body } = await fixture(
    context,
    Array.from({ length: 130 }, (_, index) => post(index)),
  );
  const manifest = await generateStaticSearch(options);
  assert.equal(await readFile(options.catalogFilename, "utf8"), body);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.totalPosts, 130);
  assert.deepEqual(manifest.tags, ["TypeScript"]);
  assert.deepEqual(
    manifest.chunks.map((chunk) => chunk.count),
    [128, 2],
  );
  const published = [];
  for (const chunk of manifest.chunks) {
    assert.match(chunk.url, new RegExp(`^/blog-search/${revision}/chunk-\\d{4}\\.json$`));
    const bytes = await readFile(path.join(options.directory, chunk.url.slice(1)));
    assert.equal(bytes.length, chunk.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), chunk.sha256);
    assert.ok(chunk.bytes <= 128 * 1024);
    const records = JSON.parse(bytes);
    assert.equal(records.length, chunk.count);
    for (const record of records) {
      assert.deepEqual(Object.keys(record).sort(), [
        "date",
        "description",
        "km",
        "slug",
        "tags",
        "title",
        "type",
      ]);
      assert.deepEqual(Object.keys(record.km).sort(), ["description", "tags", "title"]);
    }
    published.push(bytes.toString());
  }
  assert.doesNotMatch(published.join(""), /PRIVATE_|private-extra/);
  const directory = path.join(options.directory, "blog-search", revision);
  assert.deepEqual((await readdir(directory)).sort(), [
    "chunk-0000.json",
    "chunk-0001.json",
    "manifest.json",
  ]);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8")),
    manifest,
  );
  assert.deepEqual((await readdir(root)).sort(), ["out", "private-index.json"]);
});

test("UTF-8 byte limits split chunks before the record limit and reject an oversized summary", async (context) => {
  const description = "ខ្មែរ".repeat(3000);
  const { options } = await fixture(
    context,
    Array.from({ length: 10 }, (_, index) => post(index, description)),
  );
  const manifest = await generateStaticSearch(options);
  assert.ok(manifest.chunks.length > 1);
  assert.equal(
    manifest.chunks.reduce((total, chunk) => total + chunk.count, 0),
    10,
  );
  for (const chunk of manifest.chunks) {
    assert.ok(chunk.count <= 128 && chunk.bytes <= 128 * 1024);
    const records = JSON.parse(
      await readFile(path.join(options.directory, chunk.url.slice(1)), "utf8"),
    );
    assert.ok(
      records.every((record) => record.description === description),
      "summaries must not be silently truncated",
    );
  }
  const oversized = await fixture(context, [post(0, "ខ្មែរ".repeat(30_000))], "b".repeat(64));
  await assert.rejects(generateStaticSearch(oversized.options), /exceeds the 128 KiB chunk limit/);
  await assert.rejects(
    readFile(
      path.join(oversized.options.directory, "blog-search", "b".repeat(64), "manifest.json"),
    ),
    { code: "ENOENT" },
  );
});

test("revision traversal is rejected before public output is created", async (context) => {
  const { options } = await fixture(context, [post(0)], "../../private");
  await assert.rejects(generateStaticSearch(options), /Invalid private blog catalog/);
  await assert.rejects(readdir(options.directory), { code: "ENOENT" });
});
