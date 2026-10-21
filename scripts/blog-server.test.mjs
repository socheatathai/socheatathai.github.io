import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "@typescript/typescript6";
const require = createRequire(import.meta.url);
const { createBlogSearch, createSearchData } = require("../src/lib/blog/search-index.ts");
const { parseBlogQuery, blogQueryHref } = require("../src/lib/blog-query.ts");
const { sitemapCount, sitemapEntries } = require("../src/lib/blog/sitemap.ts");
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

test("server query returns six summaries, preserves total and keeps all modes paginated", () => {
  const posts = Array.from({ length: 31 }, (_, id) =>
    post(id, { image: "/private-large-cover.png", featured: true }),
  );
  const search = createBlogSearch(posts);
  for (const sort of ["latest", "oldest", "title"]) {
    const page = search.page({ ...defaults, query: "API", tag: "typescript", sort, page: 2 });
    assert.equal(page.posts.length, 6);
    assert.equal(page.totalPosts, 31);
    assert.equal(page.totalPages, 6);
    assert.equal(page.currentPage, 2);
    assert.ok(page.posts.every((post) => !("image" in post) && !("featured" in post)));
  }
  assert.equal(search.page({ ...defaults, page: 6 }).posts.length, 1);
  assert.equal(search.page({ ...defaults, page: 7 }), null);
  assert.equal(search.page({ ...defaults, page: NaN }), null);
  assert.equal(search.page({ ...defaults, page: 1.5 }), null);
  assert.equal(search.page({ ...defaults, tag: "missing" }).totalPosts, 0);
});

test("indexed matching uses bilingual tokens, AND terms, prefixes and exact normalized tags", () => {
  const posts = [
    post(1, {
      title: "NestJS release",
      tags: ["TypeScript"],
      km: { title: "គម្រោងថ្មី", description: "កម្មវិធី", tags: ["ឧទាហរណ៍"] },
    }),
    post(2, { title: "Next.js website", tags: ["TypeScript Extra"] }),
    post(3, { title: "NestJS website", tags: ["Java"] }),
  ];
  const search = createBlogSearch(posts, createSearchData(posts));
  assert.deepEqual(
    search
      .page({ ...defaults, query: "Nest rele", tag: " ＴｙｐｅＳｃｒｉｐｔ " })
      .posts.map((p) => p.slug),
    ["post-1"],
  );
  assert.deepEqual(
    search.page({ ...defaults, query: "ឧទាហរណ៍", language: "km" }).posts.map((p) => p.slug),
    ["post-1"],
  );
  assert.equal(search.page({ ...defaults, query: "Nest missing" }).totalPosts, 0);
  assert.equal(
    search.page({ ...defaults, query: "one two three four five six seven eight nine" }).totalPosts,
    0,
  );
});

test("all sorts are deterministic, localized, and keep undated posts last", () => {
  const posts = [
    post("z", { title: "Apple", date: undefined }),
    post("b", { title: "Beta", date: "2025-01-01", km: { title: "ក", description: "", tags: [] } }),
    post("a", {
      title: "Alpha",
      date: "2026-01-01",
      km: { title: "ខ", description: "", tags: [] },
    }),
  ];
  const search = createBlogSearch(posts);
  const slugs = (criteria) => search.page({ ...defaults, ...criteria }).posts.map((p) => p.slug);
  assert.deepEqual(slugs({}), ["post-a", "post-b", "post-z"]);
  assert.deepEqual(slugs({ sort: "oldest" }), ["post-b", "post-a", "post-z"]);
  assert.deepEqual(slugs({ sort: "title" }), ["post-a", "post-z", "post-b"]);
  const khmerOrder = new Intl.Collator("km", { sensitivity: "base" });
  const expectedKhmer = posts
    .toSorted(
      (a, b) =>
        khmerOrder.compare(a.km?.title ?? a.title, b.km?.title ?? b.title) ||
        a.slug.localeCompare(b.slug, "en"),
    )
    .map((post) => post.slug);
  assert.deepEqual(
    slugs({ sort: "title", language: "km", tag: "TypeScript", query: "API" }),
    expectedKhmer,
  );
  for (let i = 0; i < 40; i++) search.page({ ...defaults, query: `query${i}` });
  assert.equal(search.cacheSize(), 16);
  assert.equal(
    search.related("post-a").some((p) => p.slug === "post-a"),
    false,
  );
  assert.equal(search.listingPages.get("post-a"), 1);
});

test("URL criteria are bounded, whitelisted, encoded and preserved across pages", () => {
  const query = parseBlogQuery({
    q: " a ".repeat(100),
    tag: " REST API ",
    sort: "injected",
    page: "Infinity",
    lang: "bad",
  });
  assert.equal(query.query.length, 160);
  assert.equal(query.tag, "REST API");
  assert.equal(query.sort, "latest");
  assert.equal(query.page, 1);
  assert.equal(query.language, "en");
  const href = blogQueryHref(
    { ...defaults, query: "API & web", tag: "C++", sort: "oldest", language: "km" },
    3,
  );
  assert.ok(href.startsWith("/blog/page/3/?"));
  const url = new URL(href, "https://example.test");
  assert.equal(url.searchParams.get("q"), "API & web");
  assert.equal(url.searchParams.get("tag"), "C++");
  assert.equal(url.searchParams.get("sort"), "oldest");
  assert.equal(url.searchParams.get("lang"), "km");
  assert.equal(parseBlogQuery({ page: "999" }, 2).page, 2);
});

test("sitemaps shard 50,000 posts and archive URLs without missing or duplicate entries", () => {
  const posts = Array.from({ length: 50_000 }, (_, id) => post(id));
  const all = [];
  assert.equal(sitemapCount(posts.length), 6);
  for (let id = 0; id < sitemapCount(posts.length); id++) {
    const entries = sitemapEntries(posts, id);
    assert.ok(entries.length <= 10_000);
    all.push(...entries.map((entry) => entry.path));
  }
  assert.equal(all.length, 50_000 + 8333 + 4);
  assert.equal(new Set(all).size, all.length);
  assert.equal(sitemapEntries(posts, 6), null);
  assert.equal(sitemapEntries(posts, -1), null);
});

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const compiled = new Map();

function loadFixtureRepository(root, mode) {
  const modules = new Map();
  const reads = [];
  const fileSystem = {
    ...fs,
    readFileSync(filename, ...args) {
      reads.push(String(filename));
      return fs.readFileSync(filename, ...args);
    },
  };

  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    if (!compiled.has(filename)) {
      compiled.set(
        filename,
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
          },
        }).outputText,
      );
    }
    const module = { exports: {} };
    modules.set(filename, module);
    const localRequire = (specifier) => {
      if (specifier === "server-only") return {};
      if (specifier === "react") return { cache: (callback) => callback };
      if (specifier === "node:fs") return fileSystem;
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return require(specifier);
      const next = specifier.startsWith("@/")
        ? path.join(sourceRoot, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      return load(path.extname(next) ? next : `${next}.ts`);
    };
    new Function("require", "module", "exports", "process", compiled.get(filename))(
      localRequire,
      module,
      module.exports,
      { env: { ...process.env, NODE_ENV: mode }, cwd: () => root },
    );
    return module.exports;
  }

  return {
    api: load(path.join(sourceRoot, "lib/blog.ts")),
    collection: load(path.join(sourceRoot, "lib/blog/collection.ts")),
    reads,
  };
}

function fixture(context, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-blog-test-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [filename, content] of Object.entries(files)) {
    const full = path.join(root, "src/content/blog", filename);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

function mdx(slug, metadata = {}, body = `Body for ${slug}`) {
  const data = {
    title: slug,
    description: "API development",
    tags: ["TypeScript"],
    slug,
    type: "article",
    date: "2026-10-18",
    ...metadata,
  };
  return `---\n${Object.entries(data)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n\n${body}`;
}

function translated(metadata = {}) {
  return `---\n${Object.entries({
    title: "ភាសាខ្មែរ",
    description: "កម្មវិធី",
    tags: ["ឧទាហរណ៍"],
    ...metadata,
  })
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n\nPRIVATE-KHMER-BODY`;
}

test("production hydrates one metadata catalog and reads only the requested article bodies", (context) => {
  const files = Object.fromEntries(
    ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta"].map((slug) => [
      `nested/${slug}-source.mdx`,
      mdx(
        slug,
        slug === "beta"
          ? {
              type: "project",
              featured: true,
              image: "https://images.example.test/cover.png",
              projectUrl: "https://example.test/",
            }
          : {},
        `PRIVATE-BODY-${slug}`,
      ),
    ]),
  );
  files["nested/alpha-source.mdx"] = `\uFEFF\n\n${files["nested/alpha-source.mdx"]}`;
  files["nested/alpha-source.km.mdx"] = translated();
  const root = fixture(context, files);
  const publishing = loadFixtureRepository(root, "production");
  const catalog = publishing.collection.buildBlogCatalog();
  const json = JSON.stringify(catalog);
  assert.equal(catalog.posts.length, 7);
  assert.deepEqual(catalog.tags, ["TypeScript"]);
  assert.equal(publishing.reads.filter((filename) => filename.endsWith(".mdx")).length, 8);
  assert.ok(!json.includes("PRIVATE-BODY-") && !json.includes("PRIVATE-KHMER-BODY"));
  fs.mkdirSync(path.join(root, ".generated"));
  const indexFile = path.join(root, ".generated/blog-index.json");
  fs.writeFileSync(indexFile, json);

  const runtime = loadFixtureRepository(root, "production");
  for (let i = 0; i < 3; i++) {
    assert.equal(runtime.api.getBlogPosts().length, 7);
    assert.equal(runtime.api.getBlogMetadata("alpha").title, "alpha");
    assert.equal(runtime.api.getFeaturedProjects()[0].slug, "beta");
    assert.deepEqual(runtime.api.getBlogTagOptions(), ["TypeScript"]);
    assert.equal(runtime.api.getBlogSlugs().length, 7);
    assert.equal(runtime.api.getBlogPage(1).posts.length, 6);
    assert.equal(runtime.api.getBlogPage(2).posts.length, 1);
    assert.equal(runtime.api.getBlogPage(3), null);
    assert.equal(runtime.api.getBlogListingPage(catalog.posts.at(-1).slug), 2);
    assert.equal(runtime.api.getRelatedBlogPosts("alpha").length, 3);
  }
  assert.equal(runtime.reads.filter((filename) => filename === indexFile).length, 1);
  assert.equal(runtime.reads.filter((filename) => filename.endsWith(".mdx")).length, 0);
  assert.equal(runtime.api.getBlogPost("../alpha"), null);

  const article = runtime.api.getBlogPost("alpha");
  assert.ok(article.content.includes("PRIVATE-BODY-alpha"));
  assert.ok(article.kmContent.includes("PRIVATE-KHMER-BODY"));
  assert.ok(!article.content.includes("slug:"));
  assert.equal(runtime.reads.filter((filename) => filename.endsWith(".mdx")).length, 2);
  runtime.api.getBlogPost("gamma");
  assert.equal(runtime.reads.filter((filename) => filename.endsWith(".mdx")).length, 3);
  fs.writeFileSync(indexFile, json.replace('"title":"alpha"', '"title":"changed"'));
  assert.equal(
    runtime.api.getBlogMetadata("alpha").title,
    "alpha",
    "published catalog is process-local and immutable until restart",
  );
  assert.throws(
    () => runtime.collection.readBlogFile("../outside.mdx"),
    /inside the blog collection/,
  );
  assert.throws(
    () => runtime.collection.readBlogFile("/outside.mdx"),
    /inside the blog collection/,
  );
});

test("development re-reads metadata and requested content after edits", (context) => {
  const root = fixture(context, {
    "article.mdx": mdx("article", { title: "Before" }, "Body before"),
  });
  const { api } = loadFixtureRepository(root, "development");
  assert.equal(api.getBlogMetadata("article").title, "Before");
  fs.writeFileSync(
    path.join(root, "src/content/blog/article.mdx"),
    mdx("article", { title: "After" }, "Body after"),
  );
  assert.equal(api.getBlogMetadata("article").title, "After");
  assert.ok(api.getBlogPost("article").content.includes("Body after"));
});

test("catalog publishing preserves duplicate, date, and translation-pair validation", (context) => {
  const cases = [
    [{ "first.mdx": mdx("same"), "second.mdx": mdx("same") }, /already used/],
    [{ "article.mdx": mdx("article", { date: "2026-02-30" }) }, /valid YYYY-MM-DD/],
    [{ "orphan.km.mdx": translated() }, /sibling English/],
    [
      { "article.mdx": mdx("article"), "article.km.mdx": translated({ date: "2026-10-17" }) },
      /date must match/,
    ],
    [
      { "article.mdx": mdx("article"), "article.km.mdx": translated({ slug: "other" }) },
      /shared field/,
    ],
  ];
  for (const [files, expected] of cases) {
    const root = fixture(context, files);
    const { collection } = loadFixtureRepository(root, "production");
    assert.throws(() => collection.buildBlogCatalog(), expected);
  }
  const root = fixture(context, { "article.mdx": mdx("article") });
  fs.symlinkSync("article.mdx", path.join(root, "src/content/blog/alias.mdx"));
  assert.throws(
    () => loadFixtureRepository(root, "production").collection.buildBlogCatalog(),
    /symbolic links/,
  );
});

test("related candidates stay bounded with 50,000 metadata entries", () => {
  let tagReads = 0;
  const posts = Array.from({ length: 50_000 }, (_, id) => {
    const tags = id % 10 === 0 ? ["common", "rare"] : ["common"];
    const entry = post(id, { type: id % 2 ? "article" : "project" });
    Object.defineProperty(entry, "tags", {
      enumerable: true,
      get() {
        tagReads += 1;
        return tags;
      },
    });
    return entry;
  });
  const search = createBlogSearch(posts);
  tagReads = 0;
  const related = search.related(posts.at(-1).slug);
  assert.equal(related.length, 3);
  assert.ok(related.every((entry) => entry.slug !== posts.at(-1).slug));
  assert.ok(tagReads <= 25, `scored ${tagReads} tag arrays instead of scanning the archive`);
  assert.deepEqual(search.related("missing"), []);

  const small = createBlogSearch([
    post("current", { tags: ["one", "two"] }),
    post("two-shared", { type: "project", tags: ["one", "two"], date: "2025-01-01" }),
    post("same-type", { tags: ["one"] }),
    post("other-type", { type: "project", tags: ["one"] }),
  ]);
  assert.deepEqual(
    small.related("post-current").map((entry) => entry.slug),
    ["post-two-shared", "post-same-type", "post-other-type"],
  );
});
