/* PWA_CONFIG is injected after next build; application documents are never precached. */
const PREFIX = "socheata-portfolio-";
const SHELL = `${PREFIX}precache-${PWA_CONFIG.version}`;
const READY = "/__pwa_ready__";
const buckets = Object.fromEntries(
  Object.entries(PWA_CONFIG.runtime).map(([kind, limits]) => [
    kind,
    { ...limits, name: `${PREFIX}${kind}-${PWA_CONFIG.version}` },
  ]),
);
const absolute = (value) => new URL(value, self.location.origin).href;
const key = (request) => new Request(request.url, { method: "GET" });
let writes = Promise.resolve();

async function ready() {
  if (!(await caches.has(SHELL))) return false;
  const marker = await (await caches.open(SHELL)).match(absolute(READY));
  return Boolean(marker && (await marker.text()) === PWA_CONFIG.version);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (await ready()) return;
      const cache = await caches.open(SHELL);
      try {
        // A fixed shell keeps installation independent of the article and search index size.
        for (const pathname of PWA_CONFIG.precache) {
          const response = await fetch(
            new Request(absolute(pathname), {
              cache: "reload",
              credentials: "same-origin",
            }),
          );
          if (!response.ok || response.redirected || response.type === "opaque")
            throw new Error(`Cannot cache shell ${pathname}`);
          const digest = Array.from(
            new Uint8Array(
              await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer()),
            ),
            (byte) => byte.toString(16).padStart(2, "0"),
          ).join("");
          if (digest !== PWA_CONFIG.integrity[pathname])
            throw new Error(`Mixed PWA shell ${pathname}`);
          await cache.put(absolute(pathname), response);
        }
        await cache.put(absolute(READY), new Response(PWA_CONFIG.version));
        // A replacement worker waits for the explicit reload action.
      } catch (error) {
        await caches.delete(SHELL);
        throw error;
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (!(await ready())) throw new Error("Incomplete PWA shell");
      const keep = new Set([SHELL, ...Object.values(buckets).map((bucket) => bucket.name)]);
      // Remove legacy static-export caches too: their documents ignored meaningful server queries.
      for (const name of await caches.keys())
        if (name.startsWith(PREFIX) && !keep.has(name)) await caches.delete(name);
      await self.clients.claim();
      for (const client of await self.clients.matchAll({ type: "window" }))
        client.postMessage({ type: "PWA_READY", version: PWA_CONFIG.version });
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
  if (event.data?.type === "GET_STATUS" && event.ports?.[0])
    event.waitUntil(
      (async () => {
        event.ports[0].postMessage({
          type: "PWA_STATUS",
          ready: await ready(),
          version: PWA_CONFIG.version,
        });
      })(),
    );
});

async function cached(request, bucket) {
  if (!(await caches.has(bucket.name))) return null;
  const cache = await caches.open(bucket.name);
  const response = await cache.match(key(request));
  if (!response) return null;
  const saved = Number(response.headers.get("x-pwa-cached-at"));
  const age = Date.now() - saved;
  if (!saved || age < 0 || age >= bucket.age) {
    await cache.delete(key(request));
    return null;
  }
  return response;
}

async function store(request, response, bucket, type) {
  if (
    request.method !== "GET" ||
    request.cache === "no-store" ||
    /no-store/i.test(request.headers.get("cache-control") ?? "") ||
    response.status !== 200 ||
    response.redirected ||
    response.type === "opaque" ||
    /(?:no-store|private)/i.test(response.headers.get("cache-control") ?? "") ||
    response.headers
      .get("vary")
      ?.split(",")
      .some((value) => value.trim() === "*") ||
    !(response.headers.get("content-type") ?? "").toLowerCase().includes(type)
  )
    return;
  const length = Number(response.headers.get("content-length"));
  if (length > bucket.bytes) return;
  const reader = response.body?.getReader();
  if (!reader) return;
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > bucket.bytes) {
      void reader.cancel().catch(() => {});
      return;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("x-pwa-cached-at", String(Date.now()));
  const saved = new Response(body, { status: response.status, headers });
  // Serialization bounds the cache even when many requests finish together.
  writes = writes
    .catch(() => {})
    .then(async () => {
      const cache = await caches.open(bucket.name);
      await cache.delete(key(request));
      await cache.put(key(request), saved);
      const keys = await cache.keys();
      for (const oldest of keys.slice(0, Math.max(0, keys.length - bucket.count)))
        await cache.delete(oldest);
    });
  await writes;
}

function forMethod(request, response) {
  return request.method === "HEAD"
    ? new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    : response;
}

async function offlineResponse(request) {
  const fallback = (await caches.has(SHELL))
    ? await (await caches.open(SHELL)).match(absolute("/offline.html"))
    : null;
  return new Response(
    request.method === "HEAD" ? null : fallback ? await fallback.text() : "Offline",
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

async function resource(request, bucket, type, networkFirst) {
  if (!networkFirst) {
    const hit = await cached(request, bucket);
    if (hit) return { response: forMethod(request, hit) };
  }
  try {
    const response = await fetch(request);
    return {
      response: forMethod(request, response),
      save: store(request, response.clone(), bucket, type).catch(() => {}),
    };
  } catch {
    const hit = await cached(request, bucket);
    if (hit) return { response: forMethod(request, hit) };
    return { response: networkFirst ? await offlineResponse(request) : Response.error() };
  }
}

function publicDocument(pathname) {
  return /^\/(?:about\/?|contact\/?|blog\/?|blog\/page\/[1-9]\d*\/?|blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/?|)$/.test(
    pathname,
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!["GET", "HEAD"].includes(request.method)) return;
  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname === "/sw.js" ||
    request.headers.has("range") ||
    request.headers.has("authorization") ||
    request.cache === "no-store" ||
    /no-store/i.test(request.headers.get("cache-control") ?? "")
  )
    return;
  // Server query, API and RSC responses must never be replaced by a generic cached document.
  if (
    request.headers.get("rsc") === "1" ||
    request.headers.get("accept")?.includes("text/x-component") ||
    url.searchParams.has("_rsc") ||
    /^\/api(?:\/|$)/.test(url.pathname)
  )
    return;
  if (PWA_CONFIG.precache.includes(url.pathname) && !url.search) {
    event.respondWith(
      (async () =>
        forMethod(
          request,
          (await (await caches.open(SHELL)).match(absolute(url.pathname))) ??
            (await fetch(request)),
        ))(),
    );
    return;
  }
  const document =
    request.mode === "navigate" || (request.method === "HEAD" && publicDocument(url.pathname));
  if (document && (url.search || !publicDocument(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => forMethod(request, response))
        .catch(() => offlineResponse(request)),
    );
    return;
  }
  let result;
  if (document) result = resource(request, buckets.documents, "text/html", true);
  else if (url.pathname.startsWith("/_next/static/") && !url.search) {
    const type = url.pathname.endsWith(".css")
      ? "text/css"
      : /\.(woff2?|ttf|otf)$/.test(url.pathname)
        ? "font/"
        : url.pathname.endsWith(".js")
          ? "javascript"
          : null;
    if (type) result = resource(request, buckets.assets, type, false);
  } else if (url.pathname.startsWith("/images/") && !url.search)
    result = resource(request, buckets.images, "image/", false);
  if (result) {
    event.respondWith(result.then((value) => value.response));
    event.waitUntil(result.then((value) => value.save));
  }
});
