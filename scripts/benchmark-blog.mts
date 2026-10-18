import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createBlogSearch, createSearchData } = require("../src/lib/blog/search-index.ts");
const posts = Array.from({ length: 50_000 }, (_, id) => ({
  slug: `scale-post-${id.toString().padStart(5, "0")}`,
  title: `Building ${id % 2 ? "NestJS" : "Next.js"} project ${id}`,
  description: `API development and software architecture example ${id}`,
  type: "article",
  date: "2026-10-18",
  tags: ["TypeScript", id % 2 ? "Backend" : "Frontend"],
  km: { title: `គម្រោង ${id}`, description: "ការអភិវឌ្ឍកម្មវិធី", tags: ["TypeScript"] },
}));
let started = performance.now();
const data = createSearchData(posts);
const buildMs = performance.now() - started;
const indexBytes = Buffer.byteLength(JSON.stringify(data));
started = performance.now();
const search = createBlogSearch(posts, data);
const hydrateMs = performance.now() - started;
const base = { query: "", tag: null, sort: "latest", page: 1, language: "en" };
const timings = [];
for (const criteria of [
  base,
  { ...base, page: 8334 },
  { ...base, tag: "Backend", page: 3000 },
  { ...base, query: "NestJS API", tag: "Backend", sort: "title", page: 1000 },
  { ...base, query: "NestJS API", tag: "Backend", sort: "title", page: 1001 },
  { ...base, query: "គម្រោង", language: "km", page: 2 },
]) {
  const before = performance.now();
  const result = search.page(criteria);
  timings.push({
    criteria,
    ms: Math.round((performance.now() - before) * 100) / 100,
    total: result?.totalPosts,
    bytes: Buffer.byteLength(JSON.stringify(result)),
  });
  assert.ok(result);
  assert.ok(result.posts.length <= 6);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 12_000);
}
started = performance.now();
for (let id = 0; id < 1000; id++) assert.ok(search.related(posts[id].slug).length <= 3);
console.log(
  JSON.stringify(
    {
      fixturePosts: posts.length,
      indexBytes,
      buildMs: Math.round(buildMs),
      hydrateMs: Math.round(hydrateMs),
      timings,
      related1000Ms: Math.round(performance.now() - started),
      heapMiB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    null,
    2,
  ),
);
console.log(
  "Synthetic server index/query benchmark only; this does not build or load-test 50,000 real MDX pages.",
);
