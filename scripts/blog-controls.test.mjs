import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import test from "node:test";

const defaults = { query: "", tag: null, sort: "latest", page: 1, language: "en" };
function controls(initial = defaults) {
  const slots = [];
  const listeners = new Set();
  const timers = new Map();
  const calls = [];
  let cursor = 0,
    sequence = 0,
    dialog = null,
    focusCount = 0;
  let criteria = initial,
    queue = [];
  const window = { location: { search: "?lang=en" } };
  class Element {
    constructor(editable = false) {
      this.editable = editable;
    }
    closest() {
      return this.editable ? this : null;
    }
  }
  const input = Object.assign(new Element(true), {
    focus() {
      focusCount++;
    },
  });
  const react = {
    useState(value) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = value;
      return [
        slots[id],
        (value) => {
          slots[id] = value;
        },
      ];
    },
    useRef(value) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = { current: value };
      return slots[id];
    },
    useTransition() {
      return [false, (fn) => fn()];
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
      if (name === "next/navigation")
        return {
          useRouter: () => ({
            push: (href, options) => calls.push({ method: "push", href, options }),
            replace: (href, options) => calls.push({ method: "replace", href, options }),
          }),
        };
      return load(
        path.resolve(
          name.startsWith("@/") ? "src" : path.dirname(filename),
          name.startsWith("@/") ? name.slice(2) + ".ts" : name + ".ts",
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
      {
        querySelector: () => dialog,
        addEventListener: (_type, fn) => listeners.add(fn),
        removeEventListener: (_type, fn) => listeners.delete(fn),
      },
      { platform: "MacIntel" },
      Element,
      (fn) => {
        const id = ++sequence;
        timers.set(id, fn);
        return id;
      },
      (id) => timers.delete(id),
    );
    return exports;
  }
  const { useBlogSearch } = load(path.resolve("src/hooks/useBlogSearch.ts"));
  function render(language = "en", nextCriteria = criteria) {
    criteria = nextCriteria;
    cursor = 0;
    queue = [];
    const result = useBlogSearch(criteria, language);
    result.inputRef.current = input;
    for (const effect of queue) effect();
    return result;
  }
  const first = render();
  return {
    render,
    calls,
    input,
    Element,
    window,
    get focusCount() {
      return focusCount;
    },
    tick() {
      for (const [id, fn] of [...timers]) {
        timers.delete(id);
        fn();
      }
    },
    get pendingTimers() {
      return timers.size;
    },
    key(values = {}) {
      let prevented = false;
      const event = {
        key: "k",
        ctrlKey: true,
        target: new Element(),
        preventDefault() {
          prevented = true;
        },
        ...values,
      };
      for (const listener of listeners) listener(event);
      return prevented;
    },
    dialog(containsInput) {
      dialog = { contains: () => containsInput };
    },
    cleanup() {
      for (const slot of slots) slot?.cleanup?.();
      assert.equal(listeners.size, 0);
      assert.equal(timers.size, 0);
    },
  };
}
const queryOf = (call) => new URL(call.href, "https://example.test").searchParams;

test("typing debounces server URL updates and keeps a newer draft when an older result arrives", () => {
  const host = controls();
  host.render().setQuery("api");
  host.render();
  assert.equal(host.calls.length, 0);
  host.tick();
  assert.equal(host.calls.length, 1);
  assert.equal(queryOf(host.calls[0]).get("q"), "api");
  host.render().setQuery("api new");
  host.render();
  host.render("en", { ...defaults, query: "api" });
  assert.equal(host.render().query, "api new");
  host.tick();
  assert.equal(queryOf(host.calls.at(-1)).get("q"), "api new");
  host.cleanup();
});

test("filters use the latest draft, reset paging, preserve sort, cancel debounce and reset together", () => {
  const host = controls({ ...defaults, sort: "oldest", page: 3 });
  host.render().setQuery("api");
  host.render();
  host.render().setTag("TypeScript");
  const call = host.calls.at(-1);
  assert.equal(new URL(call.href, "https://example.test").pathname, "/blog/");
  assert.equal(queryOf(call).get("q"), "api");
  assert.equal(queryOf(call).get("tag"), "TypeScript");
  assert.equal(queryOf(call).get("sort"), "oldest");
  assert.equal(host.pendingTimers, 0);
  host.render().resetFilters();
  assert.equal(queryOf(host.calls.at(-1)).get("q"), null);
  assert.equal(queryOf(host.calls.at(-1)).get("tag"), null);
  assert.equal(queryOf(host.calls.at(-1)).get("sort"), null);
  assert.equal(host.focusCount, 1);
  host.cleanup();
});

test("URL back/forward restores the draft and locale navigation does not overwrite an in-flight history URL", () => {
  const host = controls({ ...defaults, query: "old", language: "en" });
  host.render("en", { ...defaults, query: "back" });
  assert.equal(host.render().query, "back");
  host.window.location.search = "?q=previous&lang=km";
  host.render("km");
  assert.equal(host.calls.length, 0, "history already requested the target locale");
  host.window.location.search = "?q=back&lang=km";
  host.render("en", { ...defaults, query: "back", language: "km" });
  assert.equal(queryOf(host.calls.at(-1)).get("lang"), "en");
  host.cleanup();
});

test("keyboard focus, clear and listener cleanup respect editors and dialogs", () => {
  const host = controls({ ...defaults, query: "api", tag: "TypeScript" });
  assert.equal(host.render().shortcut, "⌘ K");
  assert.equal(host.key(), true);
  for (const values of [
    { isComposing: true },
    { repeat: true },
    { altKey: true },
    { shiftKey: true },
    { target: new host.Element(true) },
  ])
    assert.equal(host.key(values), false);
  host.dialog(false);
  assert.equal(host.key(), false);
  host.dialog(true);
  assert.equal(host.key(), true);
  host
    .render()
    .handleKeyDown({ key: "Enter", nativeEvent: { isComposing: true }, preventDefault() {} });
  assert.equal(host.calls.length, 0, "an IME confirmation must not submit a partial query");
  host.render().handleKeyDown({ key: "Escape", preventDefault() {} });
  assert.equal(queryOf(host.calls.at(-1)).get("q"), null);
  assert.equal(queryOf(host.calls.at(-1)).get("tag"), "TypeScript");
  host.render().setQuery("unsent");
  host.render();
  host.cleanup();
});
