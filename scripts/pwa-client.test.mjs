import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "@typescript/typescript6";

const source = fs.readFileSync(new URL("../src/hooks/usePwa.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

class Events {
  listeners = new Map();

  addEventListener(type, listener, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Map());
    this.listeners.get(type).set(listener, options?.once);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, event = {}) {
    for (const [listener, once] of [...(this.listeners.get(type) ?? [])]) {
      if (once) this.removeEventListener(type, listener);
      listener(event);
    }
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0);
  }
}

class Worker extends Events {
  state = "activated";
  messages = [];

  constructor(ready) {
    super();
    this.ready = ready;
  }

  postMessage(message, ports) {
    this.messages.push(message);
    if (message.type === "GET_STATUS" && this.ready !== undefined) {
      queueMicrotask(() =>
        ports[0].postMessage({ type: "PWA_STATUS", ready: this.ready, version: "test" }),
      );
    }
  }
}

// Run the actual hook against a small state/effect host. Assertions use its public
// return value and browser events; the host does not implement PWA behavior.
function createHost(options = {}) {
  let cursor = 0;
  let mounted = false;
  let cleaned = false;
  let reloads = 0;
  let timerId = 0;
  const slots = [];
  const effects = [];
  const cleanups = [];
  const timers = new Map();
  const channels = [];
  const registrations = [];
  const watchedWorkers = new Set();
  const window = new Events();
  const document = Object.assign(new Events(), {
    readyState: options.loading ? "loading" : "complete",
    visibilityState: "visible",
  });
  const standalone = Object.assign(new Events(), { matches: options.standalone ?? false });
  const registration = Object.assign(new Events(), {
    waiting: options.waiting ?? null,
    installing: null,
    update: async () => {},
  });
  const serviceWorker = Object.assign(new Events(), {
    controller: options.controller ?? null,
    register: (url, config) => {
      registrations.push({ url, config });
      return (
        options.registrationPromise ??
        (options.fail || registrations.length <= (options.failures ?? 0)
          ? Promise.reject(new Error("unavailable"))
          : Promise.resolve(registration))
      );
    },
  });
  const navigator = {
    onLine: options.online ?? true,
    userAgent: options.ios ? "iPhone" : "test",
    platform: "",
    maxTouchPoints: 0,
    ...(options.unsupported ? {} : { serviceWorker }),
  };
  Object.assign(window, {
    isSecureContext: !options.insecure,
    matchMedia: () => standalone,
    location: {
      reload: () => {
        reloads += 1;
      },
    },
  });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: value };
      return slots[index];
    },
    useEffect(effect) {
      if (!mounted) effects.push(effect);
    },
    useCallback(callback) {
      return callback;
    },
  };
  class Channel {
    constructor() {
      this.port1 = {
        onmessage: null,
        closed: false,
        close() {
          this.closed = true;
        },
      };
      this.port2 = {
        closed: false,
        close() {
          this.closed = true;
        },
        postMessage: (data) => {
          if (!this.port1.closed) this.port1.onmessage?.({ data });
        },
      };
      channels.push(this);
    }
  }

  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert.equal(name, "react");
      return react;
    },
    process: { env: { NODE_ENV: options.development ? "development" : "production" } },
    window,
    document,
    navigator,
    MessageChannel: Channel,
    Date,
    setTimeout: (callback, delay) => {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });

  function render() {
    cursor = 0;
    return exports.usePwa();
  }

  render();
  mounted = true;
  for (const effect of effects) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    cleanups.forEach((callback) => callback());
    assert.equal(timers.size, 0, "pending timers are removed on unmount");
    for (const target of [
      window,
      document,
      standalone,
      serviceWorker,
      registration,
      ...watchedWorkers,
    ]) {
      assert.equal(
        target.listenerCount(),
        0,
        "browser and worker listeners are removed on unmount",
      );
    }
    for (const channel of channels) {
      assert.ok(
        channel.port1.closed && channel.port2.closed,
        "message ports are closed on unmount",
      );
    }
  }

  return {
    render,
    cleanup,
    registration,
    serviceWorker,
    window,
    registrations,
    standalone,
    timers,
    get reloads() {
      return reloads;
    },
    installUpdate(worker) {
      watchedWorkers.add(worker);
      registration.waiting = worker;
      registration.installing = worker;
      registration.emit("updatefound");
    },
    runTimers(delay) {
      for (const [id, timer] of [...timers]) {
        if (timer.delay !== delay) continue;
        timers.delete(id);
        timer.callback();
      }
    },
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test("registration waits for page load and does not imply offline readiness", async (context) => {
  const host = createHost({ loading: true });
  context.after(host.cleanup);
  assert.equal(host.registrations.length, 0);
  host.window.emit("load");
  await flush();
  assert.equal(host.registrations.length, 1);
  assert.equal(host.registrations[0].url, "/sw.js");
  assert.equal(host.registrations[0].config.scope, "/");
  assert.equal(host.registrations[0].config.updateViaCache, "none");
  assert.equal(host.render().offlineReady, false);
});

test("first activation avoids a reload and readiness messages must come from its controller", async (context) => {
  const host = createHost();
  context.after(host.cleanup);
  await flush();
  const worker = new Worker();
  host.serviceWorker.controller = worker;
  host.serviceWorker.emit("controllerchange");
  assert.equal(host.reloads, 0);
  assert.equal(host.render().offlineReady, false);
  host.serviceWorker.emit("message", { data: { type: "PWA_READY" }, source: new Worker() });
  assert.equal(host.render().offlineReady, false);
  host.serviceWorker.emit("message", { data: { type: "PWA_READY" }, source: worker });
  assert.equal(host.render().offlineReady, true);
  host.window.emit("offline");
  assert.equal(host.render().online, false);
  host.window.emit("online");
  assert.equal(host.render().online, true);
});

test("an existing controller must confirm cached readiness and unanswered requests time out", async (context) => {
  for (const ready of [true, false, undefined]) {
    const host = createHost({ controller: new Worker(ready) });
    context.after(host.cleanup);
    await flush();
    assert.equal(host.render().offlineReady, ready === true);
    assert.equal(host.reloads, 0);
    if (ready === undefined) {
      host.runTimers(4000);
      assert.equal(host.timers.size, 0);
      assert.equal(host.render().offlineReady, false);
    }
  }
});

test("offline readiness is restored from an existing controller even when registration fails", async (context) => {
  const host = createHost({ controller: new Worker(true), fail: true, online: false });
  context.after(host.cleanup);
  await flush();
  assert.equal(host.registrations.length, 1);
  assert.equal(host.render().online, false);
  assert.equal(host.render().offlineReady, true);
  assert.equal(host.reloads, 0);
});

test("returning online retries failed registration without overlapping requests or listeners", async (context) => {
  const host = createHost({ failures: 1 });
  context.after(host.cleanup);
  await flush();
  assert.equal(host.registrations.length, 1);
  host.window.emit("online");
  host.window.emit("online");
  assert.equal(host.registrations.length, 2);
  await flush();
  assert.equal(host.registration.listenerCount(), 1);
  host.window.emit("online");
  await flush();
  assert.equal(host.registrations.length, 2);
  assert.equal(host.registration.listenerCount(), 1);
});

test("a newly installed update waits for user action and reloads a controlled tab once", async (context) => {
  const host = createHost({ controller: new Worker(true) });
  context.after(host.cleanup);
  await flush();
  const update = new Worker();
  update.state = "installed";
  host.installUpdate(update);
  assert.equal(host.render().updateAvailable, true);
  assert.equal(update.messages.length, 0);
  host.render().applyUpdate();
  assert.equal(update.messages[0].type, "SKIP_WAITING");
  assert.equal(host.render().updating, true);
  update.state = "activated";
  host.serviceWorker.controller = update;
  host.serviceWorker.emit("controllerchange");
  host.serviceWorker.emit("controllerchange");
  assert.equal(host.reloads, 1);
});

test("a previously waiting update is offered without automatically activating it", async (context) => {
  const waiting = new Worker();
  waiting.state = "installed";
  const host = createHost({ controller: new Worker(true), waiting });
  context.after(host.cleanup);
  await flush();
  assert.equal(host.render().updateAvailable, true);
  assert.equal(waiting.messages.length, 0);
  host.render().applyUpdate();
  host.runTimers(15_000);
  assert.equal(host.render().updating, false, "a stalled update can be retried");
});

test("controller takeover initiated in another tab reloads an already controlled page", async (context) => {
  const host = createHost({ controller: new Worker(true) });
  context.after(host.cleanup);
  await flush();
  host.serviceWorker.controller = new Worker(true);
  host.serviceWorker.emit("controllerchange");
  assert.equal(host.reloads, 1);
});

test("native installation needs a captured prompt and each event can be prompted only once", async (context) => {
  const host = createHost({ ios: true });
  context.after(host.cleanup);
  await flush();
  let prompts = 0;
  let prevented = 0;
  assert.equal(host.render().canInstall, false);
  assert.equal(host.render().showIosInstall, true);
  host.window.emit("beforeinstallprompt", {
    preventDefault: () => {
      prevented += 1;
    },
    prompt: async () => {
      prompts += 1;
    },
    userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
  });
  assert.equal(prevented, 1);
  assert.equal(host.render().canInstall, true);
  await host.render().installApp();
  await host.render().installApp();
  assert.equal(prompts, 1);
  assert.equal(host.render().canInstall, false);
  assert.equal(host.render().installing, false);
  host.window.emit("appinstalled");
  assert.equal(host.render().showIosInstall, false);
});

test("standalone mode hides installation instructions", async (context) => {
  const host = createHost({ ios: true, standalone: true });
  context.after(host.cleanup);
  await flush();
  assert.equal(host.render().showIosInstall, false);
  assert.equal(host.render().canInstall, false);
});

test("development, insecure, unsupported, and failed registration leave the website usable", async (context) => {
  for (const option of ["development", "insecure", "unsupported", "fail"]) {
    const host = createHost({ [option]: true });
    context.after(host.cleanup);
    await flush();
    assert.equal(host.registrations.length, option === "fail" ? 1 : 0);
    assert.equal(host.render().offlineReady, false);
    assert.equal(host.render().updateAvailable, false);
  }
});

test("unmount cancels deferred registration and ignores late registration completion", async () => {
  const deferred = createHost({ loading: true });
  deferred.cleanup();
  deferred.window.emit("load");
  assert.equal(deferred.registrations.length, 0);

  let resolveRegistration;
  const registrationPromise = new Promise((resolve) => {
    resolveRegistration = resolve;
  });
  const pending = createHost({ registrationPromise });
  pending.cleanup();
  resolveRegistration(pending.registration);
  await flush();
  assert.equal(pending.registration.listenerCount(), 0);
  assert.equal(pending.render().offlineReady, false);
});
