import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);
const {
  BlogTopCandidates,
  compareStaticBlogPosts,
  createStaticBlogSearch,
  STATIC_SEARCH_CACHE_CHUNKS,
} = require("../src/lib/blog-static-search.ts");
const { createBlogSearch } = require("../src/lib/blog/search-index.ts");
const defaults = { query: "", tag: null, sort: "latest", page: 1, language: "en" };
const post = (id, values = {}) => ({
  slug: `post-${id}`,
  title: `Post ${id}`,
  description: "API development",
  tags: ["TypeScript"],
  type: "article",
  date: "2026-10-18",
  ...values,
});

function archive(posts, chunkSize = 128) {
  const revision = "a".repeat(64);
  const manifestUrl = `/blog-search/${revision}/manifest.json`;
  const files = new Map();
  const chunks = [];
  for (let i = 0; i < posts.length; i += chunkSize) {
    const records = posts.slice(i, i + chunkSize);
    const json = JSON.stringify(records);
    const url = `/blog-search/${revision}/chunk-${chunks.length}.json`;
    const bytes = Buffer.byteLength(json);
    chunks.push({
      url,
      count: records.length,
      bytes,
      sha256: createHash("sha256").update(json).digest("hex"),
    });
    files.set(url, json);
  }
  const manifest = {
    schemaVersion: 1,
    revision,
    totalPosts: posts.length,
    tags: ["TypeScript"],
    chunks,
  };
  files.set(manifestUrl, JSON.stringify(manifest));
  const requests = [];
  return {
    manifestUrl,
    manifest,
    files,
    requests,
    fetcher: async (url, options = {}) => {
      requests.push({ url, signal: options.signal });
      options.signal?.throwIfAborted();
      return new Response(files.get(url), { status: files.has(url) ? 200 : 404 });
    },
  };
}

test("browser search is lazy, returns six public summaries, and matches the server's bilingual criteria", async () => {
  const posts = [
    post("one", {
      title: "NestJS release",
      km: { title: "គម្រោងថ្មី", description: "កម្មវិធី", tags: ["ឧទាហរណ៍"] },
    }),
    post("two", { title: "Next.js website", tags: ["TypeScript Extra"] }),
    post("three", { title: "NestJS website", tags: ["Java"] }),
    ...Array.from({ length: 16 }, (_, id) => post(id, { date: id % 2 ? "2025-01-01" : undefined })),
  ];
  const fixture = archive(posts, 5);
  const search = createStaticBlogSearch(fixture.manifestUrl, fixture.fetcher);
  assert.equal(fixture.requests.length, 0);
  const server = createBlogSearch(posts);
  for (const criteria of [
    defaults,
    { ...defaults, page: 2 },
    { ...defaults, query: "Nest rele", tag: " ＴｙｐｅＳｃｒｉｐｔ " },
    { ...defaults, query: "ឧទាហរណ៍", language: "km" },
    { ...defaults, query: "Nest missing" },
    { ...defaults, query: "one two three four five six seven eight nine" },
    { ...defaults, tag: "Script" },
    { ...defaults, sort: "oldest" },
    { ...defaults, sort: "title", language: "km" },
  ]) {
    assert.deepEqual(
      await search.search(criteria),
      JSON.parse(JSON.stringify(server.page(criteria))),
    );
  }
  assert.ok(fixture.requests.every(({ signal }) => signal === undefined));
  assert.equal(fixture.requests.filter(({ url }) => url.endsWith("manifest.json")).length, 1);
  assert.equal(
    fixture.requests.length,
    fixture.manifest.chunks.length + 1,
    "small archives reuse cached chunks",
  );
  assert.equal((await search.search({ ...defaults, page: 999 })).currentPage, 4);
});

test("retained candidates and chunk cache stay bounded while every match is counted", async () => {
  const posts = Array.from({ length: 1_301 }, (_, id) => post(id, { title: `Title ${1301 - id}` }));
  const compare = compareStaticBlogPosts({ ...defaults, sort: "title" });
  const candidates = new BlogTopCandidates(18, compare);
  for (const entry of posts) {
    candidates.add(entry);
    assert.ok(candidates.size <= 18);
  }
  assert.deepEqual(candidates.sorted(), posts.toSorted(compare).slice(0, 18));
  const fixture = archive(posts);
  const search = createStaticBlogSearch(fixture.manifestUrl, fixture.fetcher);
  const result = await search.search({ ...defaults, sort: "title", page: 3 });
  assert.equal(result.totalPosts, posts.length);
  assert.equal(result.posts.length, 6);
  assert.deepEqual(result.posts, posts.toSorted(compare).slice(12, 18));
  assert.equal(search.cacheSize(), STATIC_SEARCH_CACHE_CHUNKS);
  assert.equal(fixture.requests.length, fixture.manifest.chunks.length + 1);
});

test("abort cancels chunk fetching and a new search can finish independently", async () => {
  const fixture = archive(
    Array.from({ length: 10 }, (_, id) => post(id)),
    2,
  );
  const controller = new AbortController();
  let block = true;
  let started;
  const waiting = new Promise((resolve) => {
    started = resolve;
  });
  const fetcher = async (url, options) => {
    if (block && url === fixture.manifest.chunks[1].url) {
      started();
      await new Promise((_, reject) =>
        options.signal.addEventListener("abort", () => reject(options.signal.reason), {
          once: true,
        }),
      );
    }
    return fixture.fetcher(url, options);
  };
  const search = createStaticBlogSearch(fixture.manifestUrl, fetcher);
  const pending = search.search({ ...defaults, query: "API" }, controller.signal);
  await waiting;
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  block = false;
  assert.equal((await search.search({ ...defaults, query: "API" })).totalPosts, 10);
});

test("browser rejects corrupt, oversized and incompatible archives", async () => {
  const fixture = archive([post(1)]);
  const chunk = fixture.manifest.chunks[0];
  fixture.files.set(chunk.url, fixture.files.get(chunk.url).replace("Post 1", "Post 2"));
  await assert.rejects(
    createStaticBlogSearch(fixture.manifestUrl, fixture.fetcher).search(defaults),
    /verification/,
  );
  fixture.manifest.chunks[0].bytes = 128 * 1024 + 1;
  fixture.files.set(fixture.manifestUrl, JSON.stringify(fixture.manifest));
  await assert.rejects(
    createStaticBlogSearch(fixture.manifestUrl, fixture.fetcher).search(defaults),
    /unsupported format/,
  );
  fixture.files.set(fixture.manifestUrl, JSON.stringify({ schemaVersion: 99 }));
  await assert.rejects(
    createStaticBlogSearch(fixture.manifestUrl, fixture.fetcher).search(defaults),
    /unsupported format/,
  );
});
