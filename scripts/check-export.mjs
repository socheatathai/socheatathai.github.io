import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
  return Boolean(condition);
};

function decode(text) {
  return text.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = {
      "&amp;": "&",
      "&quot;": '"',
      "&apos;": "'",
      "&lt;": "<",
      "&gt;": ">",
      "&#39;": "'",
    };
    const key = entity.toLowerCase();
    if (named[key]) return named[key];
    const code = parseInt(key.slice(key[2] === "x" ? 3 : 2, -1), key[2] === "x" ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

// Inspect our controlled static HTML, including '>' inside quoted attributes; not a sanitizer.
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

function readExportFile(relative) {
  try {
    return readFileSync(path.join(root, relative), "utf8");
  } catch (error) {
    check(
      false,
      error.code === "ENOENT"
        ? `Missing ${relative}`
        : `Cannot read ${relative} (${error.code ?? "read error"})`,
    );
    return null;
  }
}

function parseUrl(value, context, base) {
  try {
    const url = new URL(value, base);
    decodeURIComponent(url.pathname);
    return url;
  } catch {
    check(false, `${context}invalid URL: ${value}`);
    return null;
  }
}

function exportedFile(url) {
  const file = path.resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
  if (
    !check(!path.relative(root, file).startsWith(".."), `URL escapes export directory: ${url.href}`)
  )
    return null;
  if (!existsSync(file)) return null;
  return statSync(file).isDirectory()
    ? existsSync(path.join(file, "index.html"))
      ? path.join(file, "index.html")
      : null
    : file;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function checkSitemap(origin, sitemap, robots) {
  if (robots !== null)
    check(robots.includes(`${origin}/sitemap.xml`), "robots.txt must advertise the sitemap");
  if (sitemap === null) return 0;
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => decode(url));
  check(new Set(urls).size === urls.length, "Sitemap contains duplicate URLs");
  for (const value of urls) {
    const url = parseUrl(value, "Sitemap: ");
    if (!url) continue;
    check(url.origin === origin && url.pathname.endsWith("/"), `Invalid sitemap URL: ${value}`);
    const file = exportedFile(url);
    check(Boolean(file), `Sitemap URL has no HTML: ${value}`);
    if (file) {
      const html = readExportFile(path.relative(root, file));
      if (html !== null)
        check(
          tags(html, "link").some((tag) => tag.rel === "canonical" && tag.href === value),
          `Sitemap URL is not canonical: ${value}`,
        );
    }
  }
  return urls.length;
}

function readSchemas(html, context) {
  return [
    ...html.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script>/gi),
  ].flatMap(([, attributes, raw]) => {
    if (tags(`<script${attributes}>`, "script")[0]?.type !== "application/ld+json") return [];
    try {
      const data = JSON.parse(raw);
      const graph =
        data && !Array.isArray(data) && Object.hasOwn(data, "@graph") ? data["@graph"] : data;
      const schemas = Array.isArray(graph) ? graph : [graph];
      if (
        !schemas.every(
          (schema) => schema !== null && typeof schema === "object" && !Array.isArray(schema),
        )
      )
        throw new Error("Invalid schema shape");
      return schemas;
    } catch {
      check(false, `${context}invalid JSON-LD (expected an object or array of objects)`);
      return [];
    }
  });
}

function checkPage(relative, html, origin) {
  const context = `${relative}: `;
  const metas = tags(html, "meta");
  const meta = (name) => metas.find((tag) => tag.name === name || tag.property === name)?.content;
  const canonicals = tags(html, "link").filter((tag) => tag.rel === "canonical");
  const route = `/${relative.replace(/index\.html$/, "")}`;
  const isError = relative === "404.html" || route === "/404/" || route === "/_not-found/";
  check(/<title>[^<]+<\/title>/.test(html), `${context}missing title`);
  check(Boolean(meta("description")), `${context}missing description`);
  check((html.match(/<h1\b/gi) ?? []).length === 1, `${context}expected one H1`);
  if (isError) {
    check(
      metas.some((tag) => tag.name === "robots" && tag.content?.includes("noindex")),
      `${context}error page must be noindex`,
    );
    return false;
  }
  check(canonicals.length === 1, `${context}expected one canonical URL`);
  const canonical = canonicals[0]?.href;
  const expected = `${origin}${route === "/blog/page/1/" ? "/blog/" : route}`;
  check(canonical === expected, `${context}canonical should be ${expected}`);
  check(meta("og:url") === canonical, `${context}Open Graph URL differs from canonical`);
  for (const field of ["og:title", "og:description", "og:image", "twitter:card", "twitter:image"])
    check(Boolean(meta(field)), `${context}missing ${field}`);
  check(
    Boolean(meta("robots")) && !meta("robots").includes("noindex"),
    `${context}content page must be indexable`,
  );

  for (const field of ["og:image", "twitter:image"]) {
    const value = meta(field);
    if (!value) continue;
    const url = parseUrl(value, `${context}${field}: `, origin);
    if (url)
      check(
        url.origin === origin && Boolean(exportedFile(url)),
        `${context}${field} must reference an existing local image`,
      );
  }
  for (const image of tags(html, "img")) {
    check(Object.hasOwn(image, "alt"), `${context}image needs alt text: ${image.src}`);
    const url = image.src ? parseUrl(image.src, `${context}image: `, origin) : null;
    if (url?.href === meta("og:image"))
      check(image.width && image.height, `${context}cover image needs dimensions: ${image.src}`);
  }
  for (const tag of [...tags(html, "a"), ...tags(html, "img"), ...tags(html, "script")]) {
    const value = tag.href ?? tag.src;
    if (!value) continue;
    const url = parseUrl(value, context, expected);
    if (!url) continue;
    check(!["javascript:", "vbscript:"].includes(url.protocol), `${context}unsafe URL protocol`);
    if (url.origin === origin)
      check(Boolean(exportedFile(url)), `${context}broken local URL: ${value}`);
  }

  const schemas = readSchemas(html, context);
  const isPost = /^\/blog\/(?!page\/)[^/]+\/$/.test(route);
  if (isPost) {
    const article = schemas.find((schema) => schema["@type"] === "BlogPosting");
    check(
      Boolean(article && article.url === canonical && article.headline && article.author?.name),
      `${context}missing or invalid article structured data`,
    );
    check(
      schemas.some((schema) => schema["@type"] === "BreadcrumbList"),
      `${context}missing breadcrumb structured data`,
    );
    check(meta("og:type") === "article", `${context}incorrect Open Graph type`);
  }
  return isPost;
}

function checkExport() {
  const home = readExportFile("index.html");
  const robots = readExportFile("robots.txt");
  const sitemap = readExportFile("sitemap.xml");
  check(existsSync(path.join(root, ".nojekyll")), "Missing .nojekyll");
  if (home === null) {
    check(false, "Run npm run build before check:export.");
    return;
  }
  const canonical = tags(home, "link").find((tag) => tag.rel === "canonical")?.href;
  if (!check(Boolean(canonical), "Homepage needs a canonical URL.")) return;
  const url = parseUrl(canonical, "Homepage canonical: ");
  if (!url) return;
  const origin = url.origin;
  check(
    origin.startsWith("https://") && !origin.includes("localhost"),
    "Production URLs must use HTTPS.",
  );
  const sitemapCount = checkSitemap(origin, sitemap, robots);
  let pageCount = 0;
  let articleCount = 0;
  for (const file of walk(root).filter((file) => file.endsWith(".html"))) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    // Search Console verification is a plain response, not a public content page.
    if (/^google[\da-f]+\.html$/.test(relative)) continue;
    const html = readExportFile(relative);
    if (html === null) continue;
    pageCount++;
    if (checkPage(relative, html, origin)) articleCount++;
  }
  if (!failures.length)
    console.log(
      `Export checks passed: ${pageCount} HTML pages, ${articleCount} posts, ${sitemapCount} sitemap URLs; metadata, JSON-LD, local links and assets verified.`,
    );
}

try {
  checkExport();
} catch (error) {
  check(false, `Cannot check export: ${error.message}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
