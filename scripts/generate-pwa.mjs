import { createHash } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export const PWA_SHELL_FILES = [
  "/offline.html",
  "/site.webmanifest",
  "/images/icon-192.png",
  "/images/icon-512.png",
];
export const PWA_SHELL_MAX_BYTES = 5 * 1024 * 1024;
export const PWA_RUNTIME_LIMITS = {
  documents: { count: 16, bytes: 1024 * 1024, age: 7 * 86400000 },
  assets: { count: 64, bytes: 2 * 1024 * 1024, age: 30 * 86400000 },
  images: { count: 24, bytes: 2 * 1024 * 1024, age: 7 * 86400000 },
};

/** Generate a constant-size shell from public/, never from the post collection or search index. */
export async function generatePwa({
  directory = path.join(root, "public"),
  buildDirectory = path.join(root, ".next"),
} = {}) {
  const source = await readFile(new URL("../src/pwa/service-worker.js", import.meta.url), "utf8");
  const buildId = (await readFile(path.join(buildDirectory, "BUILD_ID"), "utf8")).trim();
  if (!/^[a-z\d._-]{1,200}$/i.test(buildId)) throw new Error("Invalid Next.js BUILD_ID");
  const hash = createHash("sha256").update(source).update("\0").update(buildId);
  const integrity = {};
  const publicRoot = await realpath(directory);
  let bytes = 0;
  for (const url of PWA_SHELL_FILES) {
    const file = path.join(directory, url.slice(1));
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Invalid shell file: ${url}`);
    const relative = path.relative(publicRoot, await realpath(file));
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
      throw new Error(`Shell file escapes public directory: ${url}`);
    const body = await readFile(file);
    hash.update("\0").update(url).update("\0").update(body);
    integrity[url] = createHash("sha256").update(body).digest("hex");
    bytes += body.length;
  }
  if (bytes > PWA_SHELL_MAX_BYTES)
    throw new Error("PWA shell exceeds its 5 MiB installation limit");
  const policy = { precache: PWA_SHELL_FILES, integrity, runtime: PWA_RUNTIME_LIMITS, bytes };
  hash.update(JSON.stringify(policy));
  const config = { version: hash.digest("hex").slice(0, 20), ...policy };
  await writeFile(
    path.join(directory, "sw.js"),
    `/* Generated; do not edit. */\nconst PWA_CONFIG = ${JSON.stringify(config)};\n${source}`,
  );
  await writeFile(path.join(directory, "pwa-assets.json"), `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  generatePwa()
    .then((result) =>
      console.log(
        `PWA shell: ${result.precache.length} files, ${result.bytes} bytes; visited pages use a bounded runtime cache.`,
      ),
    )
    .catch((error) => {
      console.error(`PWA generation failed: ${error.message}`);
      process.exitCode = 1;
    });
}
