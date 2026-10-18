import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBlogCatalog } from "../src/lib/blog/collection";

async function main() {
  const started = performance.now();
  const catalog = buildBlogCatalog();
  const directory = path.join(process.cwd(), ".generated");
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, "blog-index.json");
  const temporary = `${filename}.${process.pid}.tmp`;
  const json = JSON.stringify(catalog);
  await writeFile(temporary, json);
  await rename(temporary, filename);
  console.log(
    `Private blog index: ${catalog.posts.length} posts, ${Buffer.byteLength(json)} bytes, ${Math.round(performance.now() - started)} ms.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
