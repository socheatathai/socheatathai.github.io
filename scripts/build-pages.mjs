import { spawnSync, execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([path.resolve("node_modules/next/dist/bin/next"), "build"], {
  ...process.env,
  BUILD_TARGET: "pages",
});
run(["--import", "tsx", "scripts/generate-static-search.ts", "out"]);
// Replace any worker copied from public/ with this static build's inventory.
run(["scripts/generate-pwa.mjs", "out"]);
await writeFile("out/.nojekyll", "");

const { revision } = JSON.parse(await readFile(".generated/blog-index.json", "utf8"));
let commit = process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    commit = "local";
  }
}
await writeFile(
  "out/build-info.json",
  JSON.stringify({ target: "github-pages", commit, revision }) + "\n",
);
console.log("Current-source GitHub Pages application generated in out/.");
