import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { imageSize } from "image-size";
import { PWA_RUNTIME_LIMITS, PWA_SHELL_FILES, PWA_SHELL_MAX_BYTES } from "./generate-pwa.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://pwa-check.invalid";

function attributes(html, element) {
  return [...html.matchAll(new RegExp(`<${element}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, "gi"))].map(
    (match) =>
      Object.fromEntries(
        [...match[1].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
          ([, name, double, single]) => [name.toLowerCase(), double ?? single],
        ),
      ),
  );
}

export function checkPwa(directory = path.join(root, "public")) {
  const result = { failures: [], version: null, assets: 0, bytes: 0 };
  const check = (condition, message) => {
    if (!condition) result.failures.push(message);
    return Boolean(condition);
  };
  const directoryRoot = path.resolve(directory);

  function localPath(value) {
    if (
      typeof value !== "string" ||
      !value.startsWith("/") ||
      value.startsWith("//") ||
      /[\\\0?#]/.test(value)
    )
      return null;
    try {
      const url = new URL(value, origin);
      const decoded = decodeURIComponent(url.pathname);
      if (url.origin !== origin || decoded !== value || url.pathname !== value) return null;
      const file = path.resolve(directoryRoot, `.${value}`);
      if (path.relative(directoryRoot, file).startsWith("..")) return null;
      return file;
    } catch {
      return null;
    }
  }

  function localFile(value) {
    const file = localPath(value);
    if (!check(Boolean(file), `Invalid local PWA path: ${value}`)) return null;
    try {
      const info = lstatSync(file);
      if (
        !check(
          info.isFile() && !info.isSymbolicLink(),
          `PWA asset must be a regular file: ${value}`,
        )
      )
        return null;
      const relative = path.relative(realpathSync(directoryRoot), realpathSync(file));
      if (
        !check(
          relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
          `PWA asset escapes public directory: ${value}`,
        )
      )
        return null;
      return file;
    } catch {
      check(false, `Missing ${value}`);
      return null;
    }
  }

  function read(value) {
    const file = localFile(value);
    return file ? readFileSync(file) : null;
  }

  function json(value) {
    const body = read(value);
    if (!body) return null;
    try {
      const parsed = JSON.parse(body.toString("utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      return parsed;
    } catch {
      check(false, `Invalid JSON object: ${value}`);
      return null;
    }
  }

  try {
    const config = json("/pwa-assets.json");
    const manifest = json("/site.webmanifest");
    const worker = read("/sw.js")?.toString("utf8");
    const offline = read("/offline.html")?.toString("utf8");
    if (config) {
      check(
        typeof config.version === "string" && /^[a-f\d]{20}$/.test(config.version),
        "Invalid PWA release version",
      );
      result.version = typeof config.version === "string" ? config.version : null;
      check(
        Object.keys(config).every((field) =>
          ["version", "precache", "integrity", "runtime", "bytes"].includes(field),
        ),
        "PWA inventory must not contain per-post routes or search data",
      );
      check(
        JSON.stringify(config.precache) === JSON.stringify(PWA_SHELL_FILES),
        "Only the four fixed shell resources may be precached",
      );
      check(
        JSON.stringify(config.runtime) === JSON.stringify(PWA_RUNTIME_LIMITS),
        "Runtime caches must use the bounded document, asset and image policy",
      );
      const integrity =
        config.integrity && typeof config.integrity === "object" && !Array.isArray(config.integrity)
          ? config.integrity
          : {};
      check(
        Object.keys(integrity).length === PWA_SHELL_FILES.length &&
          Object.keys(integrity).every((value) => PWA_SHELL_FILES.includes(value)),
        "Integrity must cover exactly the fixed shell resources",
      );
      for (const value of PWA_SHELL_FILES) {
        const body = read(value);
        if (!body) continue;
        result.bytes += body.length;
        result.assets++;
        check(
          integrity[value] === createHash("sha256").update(body).digest("hex"),
          `Integrity mismatch: ${value}`,
        );
      }
      check(
        Number.isSafeInteger(config.bytes) && config.bytes === result.bytes,
        "Shell byte count mismatch",
      );
      check(result.bytes <= PWA_SHELL_MAX_BYTES, "PWA shell exceeds its 5 MiB installation limit");
      if (worker) {
        const source = readFileSync(
          new URL("../src/pwa/service-worker.js", import.meta.url),
          "utf8",
        );
        check(
          worker ===
            `/* Generated; do not edit. */\nconst PWA_CONFIG = ${JSON.stringify(config)};\n${source}`,
          "Worker and inventory differ or worker source is stale",
        );
      }
    }

    if (manifest) {
      for (const field of ["name", "short_name"])
        check(
          typeof manifest[field] === "string" && manifest[field].trim(),
          `Manifest needs ${field}`,
        );
      check(
        manifest.id === "/" &&
          manifest.start_url === "/" &&
          manifest.scope === "/" &&
          manifest.display === "standalone",
        "Invalid app identity or display",
      );
      const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
      for (const size of [192, 512])
        check(
          icons.some(
            (icon) =>
              icon?.src === `/images/icon-${size}.png` &&
              icon.sizes === `${size}x${size}` &&
              icon.type === "image/png",
          ),
          `Invalid ${size} icon`,
        );
      for (const icon of icons) {
        const file = localFile(icon?.src);
        if (!file) continue;
        try {
          const image = imageSize(readFileSync(file));
          check(
            typeof icon.sizes === "string" &&
              icon.sizes.split(/\s+/).includes(`${image.width}x${image.height}`) &&
              icon.type === `image/${image.type}`,
            `Icon dimensions or type: ${icon.src}`,
          );
        } catch {
          check(false, `Invalid icon image: ${icon.src}`);
        }
      }
      for (const shortcut of manifest.shortcuts ?? [])
        check(Boolean(localPath(shortcut?.url)), `Invalid app shortcut path: ${shortcut?.url}`);
    }
    if (offline) {
      check(
        attributes(offline, "meta").some(
          (tag) => tag.name === "robots" && /(?:^|[,\s])noindex(?:$|[,\s])/.test(tag.content ?? ""),
        ),
        "Offline fallback must be noindex",
      );
      check(
        /lang=["']km["']/.test(offline) && /offline/i.test(offline),
        "Offline fallback must include English and Khmer",
      );
      for (const href of ["/", "/blog/"])
        check(
          attributes(offline, "a").some((tag) => tag.href === href),
          `Offline fallback needs ${href}`,
        );
      check(
        !attributes(offline, "script").some((tag) => tag.src) &&
          !attributes(offline, "link").some((tag) => tag.rel === "stylesheet") &&
          !attributes(offline, "img").length &&
          !/@import\b|url\s*\(/i.test(offline),
        "Offline fallback must not depend on network resources",
      );
    }
  } catch (error) {
    check(false, `Cannot check PWA: ${error.message}`);
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = checkPwa();
  if (result.failures.length) {
    console.error(result.failures.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `PWA shell checks passed: ${result.assets} files, ${result.bytes} bytes, release ${result.version}.`,
    );
}
