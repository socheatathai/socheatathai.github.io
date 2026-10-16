import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { request } from "node:http";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

let server;
let port;
before(async () => {
  server = spawn(process.execPath, [fileURLToPath(new URL("./preview.mjs", import.meta.url))], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  port = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Preview did not start; run npm run build first.")),
      5000,
    );
    let output = "";
    let errors = "";
    server.stderr.on("data", (data) => {
      errors += data;
    });
    server.stdout.on("data", (data) => {
      output += data;
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    server.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(`Preview exited before starting: ${errors}`));
    });
  });
});
after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, "exit");
  }
});

function get(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (data) => {
        body += data;
      });
      response.on("end", () =>
        resolve({ status: response.statusCode, headers: response.headers, body }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

test("directories redirect locally and preserve query parameters", async () => {
  const result = await get("/blog?q=api%20work");
  assert.equal(result.status, 308);
  assert.equal(result.headers.location, "/blog/?q=api%20work");
  const head = await get("/blog", "HEAD");
  assert.equal(head.headers.location, "/blog/");
  assert.equal(head.body, "");
});

test("encoded network paths, backslashes, traversal and null bytes are rejected", async () => {
  for (const path of ["/%2fblog", "/%5cblog", "/blog%5c", "/%2e%2e%2fpackage.json", "/%00"]) {
    const result = await get(path);
    assert.equal(result.status, 403, path);
    assert.equal(result.headers.location, undefined, path);
  }
});

test("invalid encoding, unknown paths and unsupported methods return errors", async () => {
  assert.equal((await get("/%ZZ")).status, 400);
  assert.equal((await get("/missing-post/")).status, 404);
  const post = await get("/", "POST");
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, "GET, HEAD");
});

test("static content is served with the correct MIME type and HEAD has no body", async () => {
  const home = await get("/");
  assert.equal(home.status, 200);
  assert.match(home.headers["content-type"], /^text\/html/);
  assert.match(home.body, /<h1/);
  const head = await get("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body, "");
  assert.match((await get("/sitemap.xml")).headers["content-type"], /^application\/xml/);
});
