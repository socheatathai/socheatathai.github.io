import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const project = fileURLToPath(new URL("../", import.meta.url));

function decode(text) {
  return text.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    const key = entity.toLowerCase();
    if (named[key]) return named[key];
    const code = parseInt(key.slice(key[2] === "x" ? 3 : 2, -1), key[2] === "x" ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

// Read controlled build output, including '>' inside quoted attributes; not a sanitizer.
function tags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, "gi"))].map(
    (match) =>
      Object.fromEntries(
        [...match[1].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
          ([, name, double, single]) => [name, decode(double ?? single)],
        ),
      ),
  );
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

export function checkPages(directory = "out") {
  const root = path.resolve(directory);
  const failures = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
    return Boolean(condition);
  };
  function read(relative, binary = false) {
    try {
      return readFileSync(path.join(root, relative), binary ? undefined : "utf8");
    } catch (error) {
      check(false, `${relative}: ${error.code === "ENOENT" ? "missing file" : error.message}`);
      return null;
    }
  }
  function json(relative) {
    const raw = read(relative);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      check(false, `${relative}: invalid JSON`);
      return null;
    }
  }
  function parseUrl(value, context, base) {
    try {
      const url = new URL(value, base);
      decodeURIComponent(url.pathname);
      return url;
    } catch {
      check(false, `${context}: invalid URL ${value}`);
      return null;
    }
  }
  function exportedFile(url) {
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, pathname.replace(/^\/+/, ""));
    if (
      !check(
        !path.relative(root, file).startsWith("..") && !/[\0\\]/.test(pathname),
        `Unsafe export URL: ${url.href}`,
      )
    )
      return null;
    if (!existsSync(file)) return null;
    return statSync(file).isDirectory()
      ? existsSync(path.join(file, "index.html"))
        ? path.join(file, "index.html")
        : null
      : file;
  }
  function schemas(html, context) {
    return [
      ...html.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script>/gi),
    ].flatMap(([, attributes, raw]) => {
      if (tags(`<script${attributes}>`, "script")[0]?.type !== "application/ld+json") return [];
      try {
        const data = JSON.parse(raw);
        const graph = data?.["@graph"] ?? data;
        return Array.isArray(graph) ? graph : [graph];
      } catch {
        check(false, `${context}: invalid JSON-LD`);
        return [];
      }
    });
  }

  const catalog = JSON.parse(
    readFileSync(path.join(project, ".generated/blog-index.json"), "utf8"),
  );
  const posts = new Map(catalog.posts.map((post) => [post.slug, post]));
  const home = read("index.html");
  if (home === null) throw new Error("No static application found. Run npm run build:pages first.");
  const canonical = tags(home, "link").find((tag) => tag.rel === "canonical")?.href;
  const origin = parseUrl(canonical, "Homepage canonical")?.origin;
  check(
    Boolean(origin?.startsWith("https://") && !origin.includes("localhost")),
    "Production canonical URLs must use HTTPS",
  );
  check(
    home.includes('id="main-content"') && home.includes("/_next/static/"),
    "Homepage must be the current Next.js application",
  );
  check(existsSync(path.join(root, ".nojekyll")), "Missing .nojekyll");
  const info = json("build-info.json");
  let expectedCommit = process.env.GITHUB_SHA;
  if (!expectedCommit) {
    try {
      expectedCommit = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: project,
        encoding: "utf8",
      }).trim();
    } catch {
      expectedCommit = "local";
    }
  }
  check(
    info?.target === "github-pages" &&
      info?.revision === catalog.revision &&
      info?.commit === expectedCommit,
    "build-info.json must identify this GitHub Pages build, source commit, and current catalog revision",
  );
  const files = walk(root);
  let pageCount = 0;
  const seenPosts = new Set();

  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    check(
      !/(^|\/)(?:\.generated|\.git|node_modules|src)(\/|$)|\.(?:mdx?|map)$/.test(relative),
      `Private source file published: ${relative}`,
    );
    if (/\.(?:js|json)$/.test(relative) && !relative.startsWith("blog-search/")) {
      const text = read(relative);
      check(
        !text?.includes(".generated/blog-index.json") && !text?.includes("MiniSearch: "),
        `${relative}: private catalog or search engine included in public assets`,
      );
    }
    if (!relative.endsWith(".html") || /^google[\da-f]+\.html$/.test(relative)) continue;
    const html = read(relative);
    if (html === null) continue;
    pageCount++;
    const route = `/${relative.replace(/index\.html$/, "")}`;
    const isError = ["/404.html", "/404/", "/_not-found/", "/offline.html"].includes(route);
    const metas = tags(html, "meta");
    const meta = (name) => metas.find((tag) => tag.name === name || tag.property === name)?.content;
    check(/<title>[^<]+<\/title>/.test(html), `${relative}: missing title`);
    if (route !== "/offline.html")
      check(Boolean(meta("description")), `${relative}: missing description`);
    check((html.match(/<h1\b/gi) ?? []).length === 1, `${relative}: expected one H1`);
    if (isError) {
      check(meta("robots")?.includes("noindex"), `${relative}: error page must be noindex`);
      continue;
    }
    const expected = `${origin}${route === "/blog/page/1/" ? "/blog/" : route}`;
    const canonicals = tags(html, "link").filter((tag) => tag.rel === "canonical");
    check(
      canonicals.length === 1 && canonicals[0].href === expected,
      `${relative}: canonical should be ${expected}`,
    );
    check(meta("og:url") === expected, `${relative}: Open Graph URL must match canonical`);
    for (const field of ["og:title", "og:description", "og:image", "twitter:card", "twitter:image"])
      check(Boolean(meta(field)), `${relative}: missing ${field}`);
    check(
      Boolean(meta("robots")) && !meta("robots").includes("noindex"),
      `${relative}: content page must be indexable`,
    );
    if (!posts.has(route.match(/^\/blog\/([^/]+)\/$/)?.[1])) {
      const image = `${origin}/images/seo-preview.png`;
      check(
        meta("og:image") === image &&
          meta("twitter:image") === image &&
          Boolean(exportedFile(new URL(image))),
        `${relative}: portfolio social image is missing or incorrect`,
      );
    }
    for (const tag of [
      ...tags(html, "a"),
      ...tags(html, "img"),
      ...tags(html, "script"),
      ...tags(html, "link"),
    ]) {
      const value = tag.href ?? tag.src;
      if (!value) continue;
      const url = parseUrl(value, relative, expected);
      if (!url) continue;
      check(
        !["javascript:", "vbscript:"].includes(url.protocol),
        `${relative}: unsafe URL protocol`,
      );
      if (url.origin === origin)
        check(Boolean(exportedFile(url)), `${relative}: broken local URL ${value}`);
    }
    for (const image of tags(html, "img"))
      check(Object.hasOwn(image, "alt"), `${relative}: image needs alt text ${image.src}`);
    const post = posts.get(route.match(/^\/blog\/([^/]+)\/$/)?.[1]);
    const data = schemas(html, relative);
    if (post) {
      seenPosts.add(post.slug);
      const image = new URL(post.image ?? "/images/seo-preview.png", origin).href;
      const article = data.find((schema) => schema?.["@type"] === "BlogPosting");
      check(
        decode(html.match(/<title>(.*?)<\/title>/)?.[1] ?? "") === `${post.title} | Thai Socheata`,
        `${relative}: incorrect post title`,
      );
      check(
        meta("description") === post.description && meta("og:description") === post.description,
        `${relative}: description differs from current catalog`,
      );
      check(
        meta("og:title") === `${post.title} | Thai Socheata` &&
          meta("twitter:title") === `${post.title} | Thai Socheata` &&
          meta("twitter:description") === post.description,
        `${relative}: social title/description differs from current catalog`,
      );
      check(
        meta("og:type") === "article" && meta("twitter:card") === "summary_large_image",
        `${relative}: incorrect social metadata type`,
      );
      for (const field of ["og:image", "twitter:image"]) {
        check(
          meta(field) === image,
          `${relative}: ${field} must match the post cover or default social image`,
        );
        const url = parseUrl(meta(field), `${relative} ${field}`, origin);
        if (url?.origin === origin)
          check(Boolean(exportedFile(url)), `${relative}: missing social image ${image}`);
        else check(url?.protocol === "https:", `${relative}: hosted social image must use HTTPS`);
      }
      if (post.imageWidth)
        check(
          meta("og:image:width") === String(post.imageWidth),
          `${relative}: incorrect cover width`,
        );
      if (post.imageHeight)
        check(
          meta("og:image:height") === String(post.imageHeight),
          `${relative}: incorrect cover height`,
        );
      check(
        article?.url === expected &&
          article?.mainEntityOfPage?.["@id"] === expected &&
          article?.headline === post.title &&
          article?.description === post.description &&
          article?.author?.name === "Thai Socheata" &&
          article?.author?.url === `${origin}/about/`,
        `${relative}: article JSON-LD differs from current post`,
      );
      check(
        isDeepStrictEqual(article?.image, [image]) &&
          isDeepStrictEqual(article?.keywords, post.tags),
        `${relative}: JSON-LD image or tags differ from current post`,
      );
      check(
        article?.datePublished === (post.date ? `${post.date}T00:00:00+07:00` : undefined) &&
          article?.dateModified === (post.updated ? `${post.updated}T00:00:00+07:00` : undefined),
        `${relative}: JSON-LD publication/update date differs from current post`,
      );
      check(
        meta("article:published_time") ===
          (post.date ? `${post.date}T00:00:00+07:00` : undefined) &&
          meta("article:modified_time") ===
            (post.updated ? `${post.updated}T00:00:00+07:00` : undefined),
        `${relative}: Open Graph publication/update date differs from current post`,
      );
      check(
        data.some(
          (schema) =>
            schema?.["@type"] === "BreadcrumbList" &&
            schema.itemListElement?.at(-1)?.item === expected,
        ),
        `${relative}: missing post breadcrumb JSON-LD`,
      );
    }
    const archivePage =
      route === "/blog/" ? 1 : Number(route.match(/^\/blog\/page\/(\d+)\/$/)?.[1]);
    if (archivePage) {
      const entries = [
        ...html.matchAll(/<article\b[^>]*class="blog-entry"[^>]*>[\s\S]*?<\/article>/g),
      ].map((match) => match[0]);
      const expectedPosts = catalog.posts.slice((archivePage - 1) * 6, archivePage * 6);
      check(
        entries.length === expectedPosts.length && entries.length <= 6,
        `${relative}: expected six default results per archive page`,
      );
      entries.forEach((entry, index) => {
        const href = `/blog/${expectedPosts[index]?.slug}/`;
        check(
          tags(entry.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "", "a")[0]?.href === href,
          `${relative}: default archive order differs from current catalog`,
        );
        const footer =
          entry.match(/<div\b[^>]*class="blog-entry-footer"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
        check(
          footer.includes('class="tag-list"') &&
            tags(footer, "a").some((tag) => tag.class === "text-link" && tag.href === href) &&
            footer.indexOf("</ul>") < footer.indexOf('class="text-link"'),
          `${relative}: read links must follow tags inside each entry footer`,
        );
      });
      check(
        tags(html, "input").some((tag) => tag.name === "q"),
        `${relative}: missing blog search input`,
      );
      check(
        tags(html, "select").some((tag) => tag.id === "blog-sort"),
        `${relative}: missing sort control`,
      );
      const options =
        html.match(/<select\b[^>]*id="blog-sort"[^>]*>([\s\S]*?)<\/select>/)?.[1] ?? "";
      check(
        isDeepStrictEqual(
          tags(options, "option").map((tag) => tag.value),
          ["latest", "oldest", "title"],
        ) && /<option\b[^>]*value="latest"[^>]*selected/.test(options),
        `${relative}: expected Latest, Oldest and Title sorting with Latest selected`,
      );
      const filters =
        html.match(
          /<div\b[^>]*role="group"[^>]*aria-label="Filter posts by tag"[^>]*>([\s\S]*?)<\/div>/,
        )?.[1] ?? "";
      const labels = [...filters.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(
        ([, label]) => decode(label.replace(/<[^>]+>/g, "")),
      );
      check(
        isDeepStrictEqual(labels, ["All", ...catalog.tags]),
        `${relative}: tag filters differ from current catalog`,
      );
    }
  }
  check(
    seenPosts.size === posts.size && catalog.posts.every((post) => seenPosts.has(post.slug)),
    "Every current post must have a prerendered HTML page",
  );
  check(
    schemas(home, "index.html").some(
      (schema) => schema?.["@type"] === "Person" && schema.name === "Thai Socheata",
    ),
    "Homepage must include current portfolio JSON-LD",
  );

  const robots = read("robots.txt");
  check(robots?.includes(`${origin}/sitemap.xml`), "robots.txt must advertise the sitemap");
  const sitemap = read("sitemap.xml");
  check(sitemap?.includes("<sitemapindex"), "sitemap.xml must be a sitemap index");
  const locations = (xml) =>
    [...(xml ?? "").matchAll(/<loc>(.*?)<\/loc>/g)].map(([, value]) => decode(value));
  const shards = locations(sitemap);
  check(
    shards.length > 0 && new Set(shards).size === shards.length,
    "Sitemap index needs unique shard URLs",
  );
  const sitemapUrls = [];
  for (const value of shards) {
    const url = parseUrl(value, "Sitemap shard");
    if (
      !url ||
      !check(
        url.origin === origin &&
          /^\/sitemaps\/(0|[1-9]\d*)\.xml$/.test(url.pathname) &&
          !url.search &&
          !url.hash,
        `Invalid sitemap shard URL: ${value}`,
      )
    )
      continue;
    const file = exportedFile(url);
    if (!check(Boolean(file), `Missing sitemap shard: ${value}`)) continue;
    const xml = read(path.relative(root, file));
    const entries = locations(xml);
    check(
      xml?.includes("<urlset") && entries.length > 0 && entries.length <= 10_000,
      `${value}: invalid sitemap shard or too many URLs`,
    );
    sitemapUrls.push(...entries);
    for (const entry of entries) {
      const location = parseUrl(entry, value);
      if (!location) continue;
      check(
        location.origin === origin &&
          location.pathname.endsWith("/") &&
          !location.search &&
          !location.hash,
        `Invalid sitemap page URL: ${entry}`,
      );
      const html = exportedFile(location);
      check(Boolean(html?.endsWith(".html")), `Sitemap page has no HTML: ${entry}`);
      if (html)
        check(
          tags(read(path.relative(root, html)) ?? "", "link").some(
            (tag) => tag.rel === "canonical" && tag.href === entry,
          ),
          `Sitemap page is not canonical: ${entry}`,
        );
    }
  }
  const archivePages = Array.from(
    { length: Math.max(0, Math.ceil(posts.size / 6) - 1) },
    (_, index) => `/blog/page/${index + 2}/`,
  );
  const expectedPaths = [
    "/",
    "/blog/",
    "/about/",
    "/contact/",
    ...archivePages,
    ...catalog.posts.map((post) => `/blog/${post.slug}/`),
  ];
  check(
    new Set(sitemapUrls).size === sitemapUrls.length &&
      isDeepStrictEqual(
        [...sitemapUrls].sort(),
        expectedPaths.map((value) => `${origin}${value}`).sort(),
      ),
    "Sitemap must cover every canonical page and current post exactly once",
  );

  const manifestPath = `blog-search/${catalog.revision}/manifest.json`;
  const manifest = json(manifestPath);
  check(
    manifest?.schemaVersion === 1 &&
      manifest?.revision === catalog.revision &&
      manifest?.totalPosts === posts.size &&
      isDeepStrictEqual(manifest?.tags, catalog.tags),
    `${manifestPath}: schema, revision, totalPosts or tags differ from current catalog`,
  );
  const allowedKeys = (value, allowed) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowed.includes(key));
  check(
    allowedKeys(manifest, ["schemaVersion", "revision", "totalPosts", "tags", "chunks"]),
    `${manifestPath}: unexpected fields`,
  );
  const chunks = Array.isArray(manifest?.chunks) ? manifest.chunks : [];
  check(chunks.length > 0 || posts.size === 0, `${manifestPath}: missing search chunks`);
  const publicFiles = new Set([manifestPath]);
  const searchSlugs = new Set();
  let publicCount = 0;
  for (const chunk of chunks) {
    const value = chunk?.url;
    const prefix = `/blog-search/${catalog.revision}/`;
    const url = typeof value === "string" ? parseUrl(value, "Search chunk", origin) : null;
    if (
      !check(
        allowedKeys(chunk, ["url", "count", "bytes", "sha256"]) &&
          url?.origin === origin &&
          value?.startsWith(prefix) &&
          /^chunk-\d+\.json$/.test(value.slice(prefix.length)) &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password,
        `Unsafe or invalid search chunk URL: ${value}`,
      )
    )
      continue;
    const relative = value.slice(1);
    check(!publicFiles.has(relative), `Duplicate search chunk: ${value}`);
    publicFiles.add(relative);
    const raw = read(relative, true);
    if (raw === null) continue;
    check(
      Number.isSafeInteger(chunk.count) &&
        chunk.count > 0 &&
        chunk.count <= 128 &&
        Number.isSafeInteger(chunk.bytes) &&
        chunk.bytes === raw.byteLength &&
        raw.byteLength <= 128 * 1024,
      `${relative}: incorrect count/byte size or chunk exceeds bounds`,
    );
    check(
      /^[a-f\d]{64}$/.test(chunk.sha256) &&
        createHash("sha256").update(raw).digest("hex") === chunk.sha256,
      `${relative}: SHA-256 mismatch`,
    );
    let records;
    try {
      records = JSON.parse(raw.toString("utf8"));
    } catch {
      check(false, `${relative}: invalid JSON`);
      continue;
    }
    if (
      !check(
        Array.isArray(records) && records.length === chunk.count,
        `${relative}: record count does not match manifest`,
      )
    )
      continue;
    publicCount += records.length;
    for (const record of records) {
      const post = posts.get(record?.slug);
      check(
        allowedKeys(record, ["slug", "title", "description", "tags", "type", "date", "km"]) &&
          (!record.km || allowedKeys(record.km, ["title", "description", "tags"])),
        `${relative}: search record contains private or unsupported fields`,
      );
      if (
        !check(
          Boolean(post) && !searchSlugs.has(record?.slug),
          `${relative}: unknown or duplicate post ${record?.slug}`,
        )
      )
        continue;
      searchSlugs.add(record.slug);
      const expected = {
        slug: post.slug,
        title: post.title,
        description: post.description,
        tags: post.tags,
        type: post.type,
        ...(post.date ? { date: post.date } : {}),
        ...(post.km ? { km: post.km } : {}),
      };
      check(
        isDeepStrictEqual(record, expected),
        `${relative}: public metadata differs from current post ${record.slug}`,
      );
    }
  }
  check(
    publicCount === posts.size && searchSlugs.size === posts.size,
    "Public search chunks must cover every current post exactly once",
  );
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    if (relative.startsWith("blog-search/"))
      check(publicFiles.has(relative), `Unexpected or stale public search file: ${relative}`);
  }
  if (failures.length) throw new Error(failures.join("\n"));
  return { pages: pageCount, posts: seenPosts.size, sitemapUrls: sitemapUrls.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkPages(process.argv[2]);
    console.log(
      `Pages checks passed: ${result.pages} HTML pages, ${result.posts} posts, ${result.sitemapUrls} sitemap URLs; metadata, assets, and public search verified.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
