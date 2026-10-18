import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(".next/standalone");
const catalog = JSON.parse(await readFile(path.join(root, ".generated/blog-index.json"), "utf8"));
const reserve = net.createServer();
await new Promise((resolve, reject) => {
  reserve.once("error", reject);
  reserve.listen(0, "127.0.0.1", resolve);
});
const port = reserve.address().port;
await new Promise((resolve) => reserve.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(root, "server.js")], {
  env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", (chunk) => {
  logs += chunk;
});
server.stderr.on("data", (chunk) => {
  logs += chunk;
});
server.on("error", (error) => {
  logs += error.stack;
});
const htmlArticles = (html) =>
  [...html.matchAll(/<article\b[^>]*class="blog-entry"[^>]*>[\s\S]*?<\/article>/g)].map(
    (match) => match[0],
  );
async function get(url, status = 200) {
  const response = await fetch(`${base}${url}`, {
    signal: AbortSignal.timeout(15000),
    redirect: "manual",
  });
  assert.equal(response.status, status, `${url}: ${response.status}\n${logs}`);
  return { response, text: await response.text() };
}
try {
  let started = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try {
      if ((await fetch(`${base}/`, { signal: AbortSignal.timeout(1000) })).ok) {
        started = true;
        break;
      }
    } catch {}
    await delay(100);
  }
  assert.ok(started, `Server failed to start: ${logs}`);
  for (const route of ["/", "/about/", "/contact/"]) assert.match((await get(route)).text, /<h1/);
  const archive = (await get("/blog/")).text;
  assert.equal(htmlArticles(archive).length, Math.min(6, catalog.posts.length));
  assert.ok(!archive.includes('"allPosts"') && !archive.includes('\\"allPosts\\"'));
  assert.match(archive, /name="q"/);
  const controls = archive.match(
    /role="group"[^>]*aria-label="Filter posts by tag"[^>]*>([\s\S]*?)<\/div>/,
  )?.[1];
  assert.ok(controls);
  assert.ok((controls.match(/<button/g) ?? []).length <= 6);
  for (const article of htmlArticles(archive))
    assert.ok(
      article.indexOf('class="tag-list"') < article.indexOf('class="text-link"'),
      "Read link should follow the tags",
    );
  if (catalog.posts.length > 6) {
    const page = (await get("/blog/page/2/")).text;
    assert.equal(htmlArticles(page).length, Math.min(6, catalog.posts.length - 6));
  }
  const oldest = (await get("/blog/?sort=oldest&lang=km")).text;
  assert.ok(htmlArticles(oldest).length <= 6);
  if (catalog.posts.length > 6)
    assert.match(oldest, /href="\/blog\/page\/2\/\?sort=oldest&amp;lang=km"/);
  const tag = catalog.posts[0].tags[0];
  if (tag) {
    const expected = catalog.posts.filter((post) =>
      post.tags.some(
        (value) =>
          value.normalize("NFKC").trim().toLowerCase() ===
          tag.normalize("NFKC").trim().toLowerCase(),
      ),
    );
    const filtered = (await get(`/blog/?tag=${encodeURIComponent(tag)}&sort=oldest`)).text;
    assert.equal(htmlArticles(filtered).length, Math.min(6, expected.length));
  }
  assert.equal(htmlArticles((await get("/blog/?q=zzzz-no-such-post-abcdef")).text).length, 0);
  assert.match((await get("/blog/?q=zzzz-no-such-post-abcdef")).text, /noindex/);
  if (catalog.posts.length) {
    const post = catalog.posts[0];
    const detail = (await get(`/blog/${post.slug}/`)).text;
    assert.match(detail, /application\/ld\+json/);
    if (post.image) assert.ok(detail.includes(post.image));
    assert.ok(detail.includes('rel="canonical"'));
  }
  await get("/blog/page/9999999/", 404);
  await get("/blog/not-a-real-post/", 404);
  for (const hidden of ["/.generated/blog-index.json", "/src/content/blog/2026/oct/js-coder.mdx"])
    await get(hidden, 404);
  const sitemap = (await get("/sitemap.xml")).text;
  assert.match(sitemap, /<sitemapindex/);
  const shard = (await get("/sitemaps/0.xml")).text;
  assert.match(shard, /<urlset/);
  assert.ok((shard.match(/<url>/g) ?? []).length <= 10000);
  if (catalog.posts.length) assert.ok(shard.includes(`/blog/${catalog.posts[0].slug}/`));
  assert.match((await get("/robots.txt")).text, /sitemap.xml/);
  assert.match((await get("/sw.js")).text, /PWA_CONFIG/);
  assert.equal(JSON.parse((await get("/site.webmanifest")).text).id, "/");
  const assets = [...archive.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+\.js)"/g)].map(
    (match) => match[1],
  );
  for (const asset of new Set(assets)) {
    const js = (await get(asset)).text;
    assert.ok(!js.includes("MiniSearch: "), "Search engine must stay out of client bundles");
    assert.ok(!js.includes(".generated/blog-index.json"));
  }
  console.log(
    `Server checks passed: runtime search/sort/tags, six-post pagination, private index, lazy article, sharded sitemap, PWA shell, and ${new Set(assets).size} client chunks.`,
  );
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}
