import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "@typescript/typescript6";
import test from "node:test";

const defaults = { query: "", tag: null, sort: "latest", page: 1, language: "en" };
function controls(href = "https://example.test/blog/") {
  const initial = {
    criteria: defaults,
    posts: [],
    currentPage: 1,
    totalPages: 4,
    totalPosts: 24,
    manifestUrl: "/blog-search/revision/manifest.json",
  };
  const slots = [],
    queue = [],
    calls = [],
    searches = [];
  const timers = new Map(),
    listeners = new Map(),
    metas = new Map();
  let cursor = 0,
    dirty = false,
    sequence = 0,
    language = "en",
    focusCount = 0;
  const window = {
    location: new URL(href),
    history: Object.fromEntries(
      ["pushState", "replaceState"].map((method) => [
        method,
        (_state, _title, value) => {
          calls.push({ method, href: value });
          window.location = new URL(value, window.location);
        },
      ]),
    ),
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
  };
  class Element {
    constructor(anchor = null) {
      this.anchor = anchor;
    }
    closest(selector) {
      return selector.startsWith(".blog-pagination") ? this.anchor : null;
    }
  }
  const input = { focus: () => focusCount++ };
  const document = {
    head: {
      querySelector: () => metas.get("robots"),
      append: (meta) => metas.set("robots", meta),
    },
    createElement: () => ({
      getAttribute: () => null,
      setAttribute() {},
      removeAttribute() {},
      remove: () => metas.delete("robots"),
    }),
    querySelector: () => null,
    addEventListener: (type, fn) => listeners.set(`document:${type}`, fn),
    removeEventListener: (type) => listeners.delete(`document:${type}`),
  };
  const react = {
    useState(value) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = value;
      return [
        slots[id],
        (value) => {
          const next = typeof value === "function" ? value(slots[id]) : value;
          if (!Object.is(next, slots[id])) {
            slots[id] = next;
            dirty = true;
          }
        },
      ];
    },
    useRef(value) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = { current: value };
      return slots[id];
    },
    useEffect(effect, dependencies) {
      const id = cursor++;
      const previous = slots[id];
      if (!previous || dependencies.some((dep, i) => !Object.is(dep, previous.dependencies[i]))) {
        queue.push(() => {
          previous?.cleanup?.();
          slots[id] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const require = (name) => {
      if (name === "react") return react;
      if (name === "@/lib/blog-static-search")
        return {
          createStaticBlogSearch: () => ({
            search: (criteria, signal) =>
              new Promise((resolve, reject) =>
                searches.push({ criteria, signal, resolve, reject }),
              ),
          }),
        };
      assert.ok(name !== "next/navigation", "static controls must use browser history");
      return load(
        path.resolve(
          name.startsWith("@/") ? "src" : path.dirname(filename),
          name.startsWith("@/") ? `${name.slice(2)}.ts` : `${name}.ts`,
        ),
      );
    };
    const javascript = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function(
      "require",
      "exports",
      "window",
      "document",
      "navigator",
      "Element",
      "setTimeout",
      "clearTimeout",
      javascript,
    )(
      require,
      exports,
      window,
      document,
      { platform: "MacIntel" },
      Element,
      (fn, delay) => {
        assert.equal(delay, 300);
        const id = ++sequence;
        timers.set(id, fn);
        return id;
      },
      (id) => timers.delete(id),
    );
    return exports;
  }
  const { useStaticBlogSearch } = load(path.resolve("src/hooks/useStaticBlogSearch.ts"));
  function render(nextLanguage = language) {
    language = nextLanguage;
    let result,
      iterations = 0;
    do {
      dirty = false;
      cursor = 0;
      queue.length = 0;
      result = useStaticBlogSearch(initial, language);
      result.inputRef.current = input;
      result.resultsRef.current = input;
      for (const effect of queue) effect();
      assert.ok(++iterations < 10, "effects should settle");
    } while (dirty);
    return result;
  }
  render();
  return {
    render,
    calls,
    searches,
    window,
    get focusCount() {
      return focusCount;
    },
    get pendingTimers() {
      return timers.size;
    },
    get robots() {
      return metas.get("robots")?.content;
    },
    tick() {
      for (const [id, fn] of [...timers]) {
        timers.delete(id);
        fn();
      }
    },
    back(href, nextLanguage = language) {
      window.location = new URL(href, window.location);
      listeners.get("popstate")();
      return render(nextLanguage);
    },
    click(values = {}) {
      const anchor = {
        href: "https://example.test/blog/page/2/?q=API&tag=TypeScript&sort=oldest&lang=km",
        target: "",
        hasAttribute: () => false,
      };
      let prevented = false;
      render().handlePaginationClick({
        target: new Element(anchor),
        button: 0,
        preventDefault: () => {
          prevented = true;
        },
        ...values,
      });
      return prevented;
    },
    cleanup() {
      for (const slot of slots) slot?.cleanup?.();
      assert.equal(listeners.size, 0);
      assert.equal(timers.size, 0);
    },
  };
}

test("static controls leave the initial six summaries in place and lazily read direct URL criteria", () => {
  const initial = controls();
  assert.equal(initial.searches.length, 0);
  initial.cleanup();
  const linked = controls("https://example.test/blog/?q=API&tag=TypeScript&sort=oldest&lang=km");
  assert.equal(linked.render().query, "API");
  assert.deepEqual(linked.searches[0].criteria, {
    ...defaults,
    query: "API",
    tag: "TypeScript",
    sort: "oldest",
    language: "km",
  });
  assert.equal(linked.robots, "noindex, follow");
  linked.cleanup();
});

test("typing waits 300ms, IME completion delays navigation, and filters use the latest draft", () => {
  const host = controls();
  host.render().setQuery("API");
  host.render();
  assert.equal(host.calls.length, 0);
  host.render().handleCompositionStart();
  host.render();
  host.render().setQuery("កម្មវិធី");
  host.render();
  host.tick();
  assert.equal(host.calls.length, 0);
  host.render().handleCompositionEnd();
  host.render();
  host.tick();
  host.render();
  assert.equal(new URL(host.calls[0].href, host.window.location).searchParams.get("q"), "កម្មវិធី");
  host.render().setQuery("new draft");
  host.render();
  host.render().setTag("TypeScript");
  host.render();
  const url = new URL(host.calls.at(-1).href, host.window.location);
  assert.equal(url.searchParams.get("q"), "new draft");
  assert.equal(url.searchParams.get("tag"), "TypeScript");
  assert.equal(host.pendingTimers, 0);
  host.cleanup();
});

test("superseded scans are aborted and back/forward restores drafts, filters and locale", async () => {
  const host = controls("https://example.test/blog/?q=old&lang=en");
  const first = host.searches[0];
  host.render().setQuery("new");
  host.render();
  host.tick();
  host.render();
  assert.equal(first.signal.aborted, true);
  first.resolve({ posts: [{ slug: "stale" }], currentPage: 1, totalPages: 1, totalPosts: 1 });
  await Promise.resolve();
  assert.deepEqual(host.render().result.posts, []);
  const previous = host.back("/blog/page/3/?q=previous&tag=Java&sort=title&lang=km", "km");
  assert.equal(previous.query, "previous");
  assert.deepEqual(previous.criteria, {
    ...defaults,
    query: "previous",
    tag: "Java",
    sort: "title",
    page: 3,
    language: "km",
  });
  assert.equal(host.calls.length, 1, "history restoration must not overwrite the URL");
  host.cleanup();
});

test("only unmodified archive pagination is intercepted and clearing restores focus", () => {
  const host = controls();
  for (const values of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { defaultPrevented: true },
  ]) {
    assert.equal(host.click(values), false);
  }
  assert.equal(host.calls.length, 0);
  assert.equal(host.click(), true);
  const next = host.render();
  assert.equal(next.criteria.page, 2);
  assert.equal(next.criteria.language, "km");
  assert.equal(host.calls[0].method, "pushState");
  next.handleKeyDown({ key: "Enter", nativeEvent: { isComposing: true }, preventDefault() {} });
  assert.equal(host.calls.length, 1);
  next.resetFilters();
  host.render();
  assert.equal(host.render().query, "");
  assert.equal(host.render().tag, null);
  assert.equal(host.render().sort, "latest");
  assert.ok(host.focusCount > 0);
  host.cleanup();
});
