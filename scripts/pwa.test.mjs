import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const origin = "https://socheatathai.github.io";
const workerSource = new URL("../src/pwa/service-worker.js", import.meta.url);

function requestUrl(request) {
  return new URL(typeof request === "string" ? request : request.url, origin).href;
}

class MemoryCache {
  entries = new Map();

  constructor(fetch) {
    this.fetch = fetch;
  }

  async match(request, { ignoreSearch = false } = {}) {
    const requested = new URL(requestUrl(request));
    for (const [key, response] of this.entries) {
      const candidate = new URL(key);
      if (
        requested.origin === candidate.origin &&
        requested.pathname === candidate.pathname &&
        (ignoreSearch || requested.search === candidate.search)
      )
        return response.clone();
    }
  }

  async put(request, response) {
    this.entries.set(requestUrl(request), response.clone());
  }

  async delete(request) {
    return this.entries.delete(requestUrl(request));
  }

  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url));
  }

  async addAll(requests) {
    const pending = await Promise.all(
      requests.map(async (request) => {
        const response = await this.fetch(request);
        if (!response.ok) throw new TypeError(`Cannot cache ${requestUrl(request)}`);
        return [request, response];
      }),
    );
    for (const [request, response] of pending) await this.put(request, response);
  }
}

class MemoryCacheStorage {
  entries = new Map();

  constructor(fetch) {
    this.fetch = fetch;
  }

  async open(name) {
    if (!this.entries.has(name)) this.entries.set(name, new MemoryCache(this.fetch));
    return this.entries.get(name);
  }

  async has(name) {
    return this.entries.has(name);
  }

  async keys() {
    return [...this.entries.keys()];
  }

  async delete(name) {
    return this.entries.delete(name);
  }

  async match(request, options = {}) {
    const caches = options.cacheName
      ? [this.entries.get(options.cacheName)]
      : this.entries.values();
    for (const cache of caches) {
      const response = await cache?.match(request, options);
      if (response) return response;
    }
  }
}

function createNetwork(files) {
  const requests = [];
  const overrides = new Map();
  let online = true;
  return {
    requests,
    overrides,
    setOnline(value) {
      online = value;
    },
    async fetch(request) {
      const url = new URL(requestUrl(request));
      requests.push(url.href);
      if (!online) throw new TypeError("Network unavailable");
      const override = overrides.get(url.pathname);
      if (override instanceof Error) throw override;
      if (typeof override === "function") return override(request);
      if (override) return override.clone();
      const contents = files[url.pathname];
      if (contents === undefined) return new Response("Real server 404", { status: 404 });
      const type =
        url.pathname.endsWith(".html") || url.pathname.endsWith("/")
          ? "text/html"
          : url.pathname.endsWith(".txt")
            ? "text/x-component"
            : url.pathname.endsWith(".js")
              ? "text/javascript"
              : url.pathname.endsWith(".css")
                ? "text/css"
                : url.pathname.endsWith(".woff2")
                  ? "font/woff2"
                  : url.pathname.endsWith(".png")
                    ? "image/png"
                    : "application/octet-stream";
      return new Response(contents, { headers: { "Content-Type": type } });
    },
  };
}

async function createWorker({ config, network, cacheStorage, source, now = Date.now } = {}) {
  const listeners = new Map();
  const actions = { claimed: 0, skipped: 0, broadcasts: [] };
  const caches = cacheStorage ?? new MemoryCacheStorage(network.fetch);
  const scope = {
    PWA_CONFIG: config,
    caches,
    fetch: network.fetch,
    location: new URL("/sw.js", origin),
    registration: { scope: `${origin}/` },
    clients: {
      async claim() {
        actions.claimed++;
      },
      async matchAll() {
        return [
          {
            postMessage(value) {
              actions.broadcasts.push(structuredClone(value));
            },
          },
        ];
      },
    },
    async skipWaiting() {
      actions.skipped++;
    },
    addEventListener(type, listener) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(listener);
      listeners.set(type, handlers);
    },
    URL,
    URLSearchParams,
    Request,
    Response,
    Headers,
    crypto: webcrypto,
    Uint8Array,
    console,
    setTimeout,
    clearTimeout,
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [now()]));
      }
      static now() {
        return now();
      }
    },
  };
  scope.self = scope;
  vm.runInNewContext(source ?? (await readFile(workerSource, "utf8")), scope, {
    filename: fileURLToPath(workerSource),
  });

  async function dispatch(type, fields, settle = true) {
    const pending = [];
    let response;
    let intercepted = false;
    let dispatching = true;
    const event = {
      ...fields,
      waitUntil(value) {
        assert.equal(dispatching, true, "lifetime extension must start during event dispatch");
        pending.push(Promise.resolve(value));
      },
      respondWith(value) {
        assert.equal(intercepted, false, "respondWith must be called at most once");
        intercepted = true;
        response = Promise.resolve(value);
      },
    };
    for (const listener of listeners.get(type) ?? []) listener(event);
    dispatching = false;
    const result = await response;
    const settled = Promise.all(pending);
    if (settle) await settled;
    return { intercepted, response: result, settled };
  }

  return {
    caches,
    actions,
    install: () => dispatch("install"),
    activate: () => dispatch("activate"),
    async message(type) {
      const replies = [];
      await dispatch("message", {
        data: { type },
        ports: [
          {
            postMessage(value) {
              replies.push(structuredClone(value));
            },
          },
        ],
      });
      return replies;
    },
    fetch(url, { navigation = false, headers, method = "GET", cache, settle = true } = {}) {
      const request = new Request(new URL(url, origin), { headers, method, cache });
      if (navigation) {
        Object.defineProperty(request, "mode", { value: "navigate" });
        Object.defineProperty(request, "destination", { value: "document" });
      }
      return dispatch("fetch", { request }, settle);
    },
  };
}

const shellFiles = {
  "/offline.html": "<!doctype html><h1>You are offline</h1>",
  "/site.webmanifest": '{"name":"Portfolio"}',
  "/images/icon-192.png": "icon192",
  "/images/icon-512.png": "icon512",
};
const shellPaths = Object.keys(shellFiles);
const runtimePolicy = {
  documents: { count: 16, bytes: 1024 * 1024, age: 7 * 86400000 },
  assets: { count: 64, bytes: 2 * 1024 * 1024, age: 30 * 86400000 },
  images: { count: 24, bytes: 2 * 1024 * 1024, age: 7 * 86400000 },
};
const serverFiles = {
  ...shellFiles,
  "/": "<h1>Home</h1>",
  "/about/": "<h1>About</h1>",
  "/blog/": "<h1>Blog</h1>",
  "/blog/example/": "<h1>Example article</h1>",
  "/_next/static/chunks/main-abcd.js": "console.log('app');",
  "/_next/static/chunks/main-abcd.css": "body{color:black}",
  "/_next/static/media/font-abcd.woff2": "font",
  "/images/runtime.png": "cover",
};
const cacheName = (kind, version = "test-v1") => `socheata-portfolio-${kind}-${version}`;

function shellConfig(version = "test-v1") {
  return {
    version,
    precache: shellPaths,
    integrity: Object.fromEntries(
      Object.entries(shellFiles).map(([url, body]) => [
        url,
        createHash("sha256").update(body).digest("hex"),
      ]),
    ),
    runtime: runtimePolicy,
    bytes: Object.values(shellFiles).reduce((total, value) => total + Buffer.byteLength(value), 0),
  };
}

async function installedWorker(options = {}) {
  const network = options.network ?? createNetwork({ ...serverFiles });
  const worker = await createWorker({ config: shellConfig(), network, ...options });
  await worker.install();
  return { ...worker, network };
}

test("installation fetches only the four-resource shell and readiness and activation stay explicit", async () => {
  const network = createNetwork(serverFiles);
  const worker = await createWorker({ config: shellConfig(), network });
  assert.deepEqual(await worker.message("GET_STATUS"), [
    { type: "PWA_STATUS", version: "test-v1", ready: false },
  ]);
  assert.deepEqual(await worker.caches.keys(), []);
  await worker.install();
  assert.deepEqual(
    network.requests,
    shellPaths.map((url) => origin + url),
  );
  assert.equal(worker.actions.skipped, 0);
  assert.equal((await worker.message("GET_STATUS"))[0].ready, true);
  await worker.activate();
  assert.equal(worker.actions.claimed, 1);
  assert.deepEqual(worker.actions.broadcasts, [{ type: "PWA_READY", version: "test-v1" }]);
  await worker.message("SKIP_WAITING");
  assert.equal(worker.actions.skipped, 1);
  network.setOnline(false);
  const shell = await worker.fetch("/offline.html");
  assert.equal(await shell.response.text(), shellFiles["/offline.html"]);
});

test("failed or mixed shell installs leave no ready cache and a clean retry succeeds", async () => {
  const network = createNetwork(serverFiles);
  const old = await installedWorker({ config: shellConfig("old"), network });
  const unrelated = await old.caches.open("another-app");
  await unrelated.put("/data", new Response("keep"));
  const worker = await createWorker({
    config: shellConfig("new"),
    network,
    cacheStorage: old.caches,
  });
  network.overrides.set("/images/icon-512.png", new Response("different release"));
  await assert.rejects(worker.install(), /Mixed PWA shell/);
  assert.equal((await worker.message("GET_STATUS"))[0].ready, false);
  assert.equal(await worker.caches.has(cacheName("precache", "new")), false);
  assert.equal(await worker.caches.has(cacheName("precache", "old")), true);
  assert.equal(await (await unrelated.match("/data")).text(), "keep");
  network.overrides.set("/images/icon-512.png", new Response("server error", { status: 500 }));
  await assert.rejects(worker.install(), /Cannot cache shell/);
  assert.equal(await worker.caches.has(cacheName("precache", "new")), false);
  network.overrides.delete("/images/icon-512.png");
  await worker.install();
  assert.equal((await worker.message("GET_STATUS"))[0].ready, true);
});

test("readiness stays false while the final shell resource is still downloading", async () => {
  const network = createNetwork(serverFiles);
  let release;
  let started;
  const downloading = new Promise((resolve) => {
    started = resolve;
  });
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  network.overrides.set("/images/icon-512.png", async () => {
    started();
    await pending;
    return new Response(shellFiles["/images/icon-512.png"]);
  });
  const worker = await createWorker({ config: shellConfig(), network });
  const install = worker.install();
  try {
    await downloading;
    assert.equal((await worker.message("GET_STATUS"))[0].ready, false);
  } finally {
    release();
    await install;
  }
  assert.equal((await worker.message("GET_STATUS"))[0].ready, true);
});

test("activation requires a complete shell and removes old and legacy caches only after update activation", async () => {
  const network = createNetwork(serverFiles);
  const incomplete = await createWorker({ config: shellConfig("incomplete"), network });
  await assert.rejects(incomplete.activate(), /Incomplete PWA shell/);
  assert.equal(incomplete.actions.claimed, 0);

  const old = await installedWorker({ config: shellConfig("old"), network });
  await old.activate();
  for (const name of ["documents-old", "images-old", "assets-old", "precache-legacy-static"])
    await old.caches.open(`socheata-portfolio-${name}`);
  await old.caches.open("unrelated-cache");
  const update = await installedWorker({
    config: shellConfig("new"),
    network,
    cacheStorage: old.caches,
  });
  assert.equal(
    await update.caches.has(cacheName("precache", "old")),
    true,
    "waiting does not disrupt open tabs",
  );
  const currentNames = ["documents", "assets", "images"].map((kind) => cacheName(kind, "new"));
  for (const name of currentNames) await update.caches.open(name);
  await update.activate();
  assert.deepEqual(
    new Set(await update.caches.keys()),
    new Set([cacheName("precache", "new"), ...currentNames, "unrelated-cache"]),
  );
});

test("public documents are network-first, refresh when online and support offline GET and bodyless HEAD", async () => {
  const worker = await installedWorker();
  let result = await worker.fetch("/blog/example/", { navigation: true });
  assert.equal(await result.response.text(), serverFiles["/blog/example/"]);
  worker.network.overrides.set(
    "/blog/example/",
    new Response("<h1>Updated article</h1>", { headers: { "Content-Type": "text/html" } }),
  );
  result = await worker.fetch("/blog/example/", { navigation: true });
  assert.equal(await result.response.text(), "<h1>Updated article</h1>");
  worker.network.setOnline(false);
  assert.equal(
    await (await worker.fetch("/blog/example/", { navigation: true })).response.text(),
    "<h1>Updated article</h1>",
  );
  const head = await worker.fetch("/blog/example/", { method: "HEAD" });
  assert.equal(head.response.status, 200);
  assert.equal(await head.response.text(), "");
  assert.match(head.response.headers.get("Content-Type"), /text\/html/);
  const missing = await worker.fetch("/blog/unvisited/", { navigation: true });
  assert.equal(missing.response.status, 503);
  assert.equal(missing.response.headers.get("Cache-Control"), "no-store");
  assert.equal(await missing.response.text(), shellFiles["/offline.html"]);
});

test("real HTTP errors are preserved and never overwrite a previously saved page", async () => {
  const worker = await installedWorker();
  await worker.fetch("/blog/example/", { navigation: true });
  for (const status of [404, 500]) {
    worker.network.overrides.set("/blog/example/", new Response("server error", { status }));
    const result = await worker.fetch("/blog/example/", { navigation: true });
    assert.equal(result.response.status, status);
    assert.equal(await result.response.text(), "server error");
  }
  worker.network.setOnline(false);
  assert.equal(
    await (await worker.fetch("/blog/example/", { navigation: true })).response.text(),
    serverFiles["/blog/example/"],
  );
});

test("query pages never reuse generic HTML or grow runtime storage", async () => {
  const worker = await installedWorker();
  await worker.fetch("/blog/", { navigation: true });
  const documents = await worker.caches.open(cacheName("documents"));
  worker.network.overrides.set(
    "/blog/",
    new Response("<h1>Live query results</h1>", { headers: { "Content-Type": "text/html" } }),
  );
  for (let index = 0; index < 30; index++) {
    const result = await worker.fetch(`/blog/?q=query-${index}&tag=TypeScript&page=2`, {
      navigation: true,
    });
    assert.equal(await result.response.text(), "<h1>Live query results</h1>");
  }
  assert.equal((await documents.keys()).length, 1);
  worker.network.setOnline(false);
  const query = await worker.fetch("/blog/?q=query-1", { navigation: true });
  assert.equal(query.response.status, 503);
  assert.equal(await query.response.text(), shellFiles["/offline.html"]);
  const generic = await worker.fetch("/blog/", { navigation: true });
  assert.equal(await generic.response.text(), serverFiles["/blog/"]);
});

test("RSC, API, authorization, range, external and non-GET requests bypass caching", async () => {
  const worker = await installedWorker();
  worker.network.requests.length = 0;
  for (const [url, options] of [
    ["/blog/?_rsc=token", {}],
    ["/blog/example/", { headers: { RSC: "1" } }],
    ["/blog/example/", { headers: { Accept: "text/x-component" } }],
    ["/blog/example/index.txt", {}],
    ["/api/blog/search?q=api", {}],
    ["/api", { navigation: true }],
    ["/about/", { headers: { Authorization: "Bearer private" }, navigation: true }],
    ["/about/", { cache: "no-store", navigation: true }],
    ["/about/", { headers: { "Cache-Control": "no-store" }, navigation: true }],
    ["/images/runtime.png", { headers: { Range: "bytes=0-99" } }],
    ["https://images.example.com/cover.png", {}],
    ["/blog/", { method: "POST" }],
    ["/sw.js", {}],
    ["/pwa-assets.json", {}],
  ])
    assert.equal((await worker.fetch(url, options)).intercepted, false, url);
  assert.deepEqual(worker.network.requests, []);
});

test("only public portfolio routes with cacheable HTML responses can be saved", async () => {
  const worker = await installedWorker();
  for (const [url, headers, options] of [
    ["/blog/private/", { "Content-Type": "text/html", "Cache-Control": "private" }, {}],
    ["/blog/no-store/", { "Content-Type": "text/html", "Cache-Control": "no-store" }, {}],
    ["/blog/vary/", { "Content-Type": "text/html", Vary: "*" }, {}],
    ["/blog/not-html/", { "Content-Type": "application/json" }, {}],
    ["/admin/", { "Content-Type": "text/html" }, {}],
  ]) {
    worker.network.overrides.set(url, new Response("not saved", { headers }));
    const response = await worker.fetch(url, { navigation: true, ...options });
    assert.equal(response.response.status, 200);
  }
  assert.equal(await worker.caches.has(cacheName("documents")), false);
  worker.network.setOnline(false);
  const missing = await worker.fetch("/admin/", { navigation: true });
  assert.equal(missing.response.status, 503);
});

test("concurrent visited pages, static assets and images obey their entry caps", async () => {
  const worker = await installedWorker();
  for (const [kind, count, route, type] of [
    ["documents", 16, (index) => `/blog/post-${index}/`, "text/html"],
    ["assets", 64, (index) => `/_next/static/chunks/file-${index}.js`, "text/javascript"],
    ["images", 24, (index) => `/images/cover-${index}.png`, "image/png"],
  ]) {
    await Promise.all(
      Array.from({ length: count + 4 }, async (_, index) => {
        const url = route(index);
        worker.network.overrides.set(
          url,
          new Response(`body-${index}`, { headers: { "Content-Type": type } }),
        );
        await worker.fetch(url, { navigation: kind === "documents" });
      }),
    );
    const cache = await worker.caches.open(cacheName(kind));
    assert.equal((await cache.keys()).length, count, kind);
  }
});

test("runtime resources respect size limits, expiry and cache-first asset and image behavior", async () => {
  let now = 1000;
  const worker = await installedWorker({ now: () => now });
  for (const url of [
    "/_next/static/chunks/main-abcd.js",
    "/_next/static/chunks/main-abcd.css",
    "/_next/static/media/font-abcd.woff2",
    "/images/runtime.png",
  ])
    await worker.fetch(url);
  worker.network.requests.length = 0;
  for (const url of ["/_next/static/chunks/main-abcd.js", "/images/runtime.png"])
    assert.equal((await worker.fetch(url)).response.status, 200);
  assert.deepEqual(worker.network.requests, []);

  for (const [url, kind, type] of [
    ["/blog/too-large/", "documents", "text/html"],
    ["/_next/static/chunks/too-large.js", "assets", "text/javascript"],
    ["/images/too-large.png", "images", "image/png"],
  ]) {
    worker.network.overrides.set(
      url,
      new Response(new Uint8Array(runtimePolicy[kind].bytes + 1), {
        headers: { "Content-Type": type },
      }),
    );
    const result = await worker.fetch(url, { navigation: kind === "documents" });
    assert.equal((await result.response.arrayBuffer()).byteLength, runtimePolicy[kind].bytes + 1);
    const cache = await worker.caches.open(cacheName(kind));
    assert.equal(await cache.match(url), undefined, kind);
  }
  now += runtimePolicy.images.age;
  worker.network.overrides.set(
    "/images/runtime.png",
    new Response("new cover", { headers: { "Content-Type": "image/png" } }),
  );
  assert.equal(await (await worker.fetch("/images/runtime.png")).response.text(), "new cover");
  now += runtimePolicy.assets.age;
  worker.network.setOnline(false);
  assert.equal((await worker.fetch("/_next/static/chunks/main-abcd.js")).response.status, 0);
});

test("saving a streamed document does not delay returning its network response", async () => {
  const worker = await installedWorker();
  let complete;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<h1>Streamed page"));
      complete = () => {
        controller.enqueue(new TextEncoder().encode("</h1>"));
        controller.close();
      };
    },
  });
  worker.network.overrides.set(
    "/blog/streamed/",
    () => new Response(body, { headers: { "Content-Type": "text/html" } }),
  );
  const request = worker.fetch("/blog/streamed/", { navigation: true, settle: false });
  let timer;
  try {
    const result = await Promise.race([
      request,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("response waited for cache write")), 500);
      }),
    ]);
    assert.equal(result.response.status, 200);
    complete();
    await result.settled;
    assert.equal(await result.response.text(), "<h1>Streamed page</h1>");
  } finally {
    clearTimeout(timer);
  }
});

async function shellFixture(context) {
  const directory = await mkdtemp(path.join(tmpdir(), "socheata-pwa-server-test-"));
  const buildDirectory = path.join(directory, ".next");
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(buildDirectory);
  await writeFile(path.join(buildDirectory, "BUILD_ID"), "test-build-id\n");
  for (const url of shellPaths) {
    const file = path.join(directory, url.slice(1));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, await readFile(new URL(`../public${url}`, import.meta.url)));
  }
  return { directory, buildDirectory };
}

test("generator stays constant-size for a synthetic 50,000-post index and changes version with BUILD_ID", async (context) => {
  const fixture = await shellFixture(context);
  const { generatePwa } = await import("./generate-pwa.mjs");
  const first = await generatePwa(fixture);
  const worker = await readFile(path.join(fixture.directory, "sw.js"), "utf8");
  assert.deepEqual(first.precache, shellPaths);
  assert.equal(first.precache.length, 4);
  assert.equal(first.routes, undefined);
  assert.deepEqual(first.runtime, runtimePolicy);
  const records = Array.from({ length: 50_000 }, (_, index) => ({
    slug: `post-${index}`,
    title: `Post ${index}`,
  }));
  await writeFile(path.join(fixture.directory, "blog-index.json"), JSON.stringify(records));
  const scaled = await generatePwa(fixture);
  assert.deepEqual(scaled, first);
  assert.equal(await readFile(path.join(fixture.directory, "sw.js"), "utf8"), worker);
  assert.ok(JSON.stringify(scaled).length < 2000, "inventory must not grow with the corpus");
  assert.ok(first.bytes < 5 * 1024 * 1024);
  for (const url of first.precache)
    assert.equal(
      first.integrity[url],
      createHash("sha256")
        .update(await readFile(path.join(fixture.directory, url.slice(1))))
        .digest("hex"),
    );
  const networkFiles = Object.fromEntries(
    await Promise.all(
      first.precache.map(async (url) => [
        url,
        await readFile(path.join(fixture.directory, url.slice(1))),
      ]),
    ),
  );
  const network = createNetwork(networkFiles);
  const generated = await createWorker({ source: worker, network });
  await generated.install();
  assert.equal((await generated.message("GET_STATUS"))[0].ready, true);
  await writeFile(path.join(fixture.buildDirectory, "BUILD_ID"), "different-build-id");
  assert.notEqual((await generatePwa(fixture)).version, first.version);
});

test("artifact checks validate fixed shell integrity, runtime limits, icon paths and offline independence", async (context) => {
  const fixture = await shellFixture(context);
  const { generatePwa } = await import("./generate-pwa.mjs");
  const { checkPwa } = await import("./check-pwa.mjs");
  const config = await generatePwa(fixture);
  assert.deepEqual(checkPwa(fixture.directory).failures, []);
  const inventory = path.join(fixture.directory, "pwa-assets.json");
  const manifestFile = path.join(fixture.directory, "site.webmanifest");
  const manifest = await readFile(manifestFile, "utf8");
  const offlineFile = path.join(fixture.directory, "offline.html");
  const offline = await readFile(offlineFile, "utf8");

  await writeFile(inventory, JSON.stringify({ ...config, precache: ["/../../secrets"] }));
  assert.ok(checkPwa(fixture.directory).failures.some((value) => value.includes("four fixed")));
  await writeFile(
    inventory,
    JSON.stringify({
      ...config,
      runtime: { ...config.runtime, documents: { ...config.runtime.documents, count: 50000 } },
    }),
  );
  assert.ok(checkPwa(fixture.directory).failures.some((value) => value.includes("bounded")));
  await writeFile(inventory, JSON.stringify(config));

  const malformed = JSON.parse(manifest);
  malformed.icons.push({ src: "//outside.example/icon.png", sizes: "48x48", type: "image/png" });
  await writeFile(manifestFile, JSON.stringify(malformed));
  assert.ok(
    checkPwa(fixture.directory).failures.some((value) => value.includes("Invalid local PWA path")),
  );
  malformed.icons.at(-1).src = "/images/%2e%2e/secret.png";
  await writeFile(manifestFile, JSON.stringify(malformed));
  assert.ok(
    checkPwa(fixture.directory).failures.some((value) => value.includes("Invalid local PWA path")),
  );
  await writeFile(manifestFile, manifest);

  await writeFile(
    offlineFile,
    offline + '<link rel="stylesheet" href="https://example.com/style.css">',
  );
  assert.ok(
    checkPwa(fixture.directory).failures.some((value) => value.includes("network resources")),
  );
  assert.ok(
    checkPwa(fixture.directory).failures.some((value) => value.includes("Integrity mismatch")),
  );
  await writeFile(offlineFile, offline);
  assert.deepEqual(checkPwa(fixture.directory).failures, []);
  await writeFile(path.join(fixture.buildDirectory, "BUILD_ID"), "../invalid");
  await assert.rejects(generatePwa(fixture), /Invalid Next.js BUILD_ID/);
});

test("shell generation and checks reject a parent symlink that escapes public resources", async (context) => {
  const fixture = await shellFixture(context);
  const outside = await mkdtemp(path.join(tmpdir(), "socheata-pwa-outside-"));
  context.after(() => rm(outside, { recursive: true, force: true }));
  const { generatePwa } = await import("./generate-pwa.mjs");
  const { checkPwa } = await import("./check-pwa.mjs");
  await generatePwa(fixture);
  for (const name of ["icon-192.png", "icon-512.png"])
    await writeFile(
      path.join(outside, name),
      await readFile(path.join(fixture.directory, "images", name)),
    );
  await rm(path.join(fixture.directory, "images"), { recursive: true });
  await symlink(outside, path.join(fixture.directory, "images"), "dir");
  await assert.rejects(generatePwa(fixture), /escapes public directory/);
  assert.ok(
    checkPwa(fixture.directory).failures.some((value) =>
      value.includes("escapes public directory"),
    ),
  );
});
