import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

try {
  await stat(path.join(root, "index.html"));
} catch {
  console.error("No static build found. Run npm run build first.");
  process.exit(1);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  let target = path.resolve(root, `.${pathname}`);
  if (path.relative(root, target).startsWith("..") || pathname.includes("\0")) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith("/")) {
        response.writeHead(308, { Location: `${encodeURI(pathname)}/` }).end();
        return;
      }
      target = path.join(target, "index.html");
    }
    const body = await readFile(target);
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(target)] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    const body = await readFile(path.join(root, "404.html")).catch(() => "Page not found");
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : body);
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://localhost:${port}`));
