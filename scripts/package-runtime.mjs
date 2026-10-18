import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve(".next/standalone");
for (const entry of await readdir(directory)) {
  if (
    [".git", ".aws", ".codex", ".agents", "out", "docs", "scripts"].includes(entry) ||
    entry.startsWith(".env")
  )
    throw new Error(
      `Unexpected workspace data in standalone output: ${entry}. Review output file tracing before deploying.`,
    );
}
await mkdir(path.join(directory, ".next"), { recursive: true });
await cp("public", path.join(directory, "public"), { recursive: true, force: true });
await cp(".next/static", path.join(directory, ".next/static"), { recursive: true, force: true });
// Explicit copies also make the private publishing artifact and lazy MDX source contract testable.
await cp(".generated", path.join(directory, ".generated"), { recursive: true, force: true });
await cp("src/content/blog", path.join(directory, "src/content/blog"), {
  recursive: true,
  force: true,
});
console.log("Standalone Node server packaged with public assets, private index, and MDX sources.");
