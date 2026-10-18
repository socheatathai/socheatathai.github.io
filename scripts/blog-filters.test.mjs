import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const compiled = new Map();

function loadSource(filename, environment = {}) {
  const modules = new Map();

  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    if (!compiled.has(file)) {
      compiled.set(
        file,
        ts.transpileModule(fs.readFileSync(file, "utf8"), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
          },
        }).outputText,
      );
    }
    const module = { exports: {} };
    modules.set(file, module);
    const require = (specifier) => {
      if (specifier === "react") return environment.react;
      const resolved = specifier.startsWith("@/")
        ? path.join(sourceRoot, specifier.slice(2))
        : path.resolve(path.dirname(file), specifier);
      return load(path.extname(resolved) ? resolved : `${resolved}.ts`);
    };
    new Function(
      "require",
      "module",
      "exports",
      "document",
      "navigator",
      "Element",
      compiled.get(file),
    )(
      require,
      module,
      module.exports,
      environment.document,
      environment.navigator,
      environment.Element,
    );
    return module.exports;
  }

  return load(path.join(sourceRoot, filename));
}

const { getBlogTags } = loadSource("lib/blog-filters.ts");
const post = (slug, values = {}) => ({
  slug,
  title: slug,
  description: "Notes about building software",
  tags: [],
  type: "article",
  ...values,
});

test("filters derive from canonical English tags with trimmed first labels and Unicode deduplication", () => {
  const posts = [
    post("article", {
      tags: [" TypeScript ", "Next.js", "", "  ", "API"],
      km: { title: "អត្ថបទ", description: "", tags: ["ភាសាខ្មែរ"] },
    }),
    post("project", { type: "project", tags: ["typescript", "Ｎｅｘｔ．ｊｓ", " api ", "Prisma"] }),
  ];
  assert.deepEqual(getBlogTags(posts), ["API", "Next.js", "TypeScript", "Prisma"]);
  assert.deepEqual(getBlogTags([post("untagged")]), []);
});

test("filter buttons use at most five tags ranked by post count with alphabetical ties", () => {
  const posts = [
    post("one", {
      tags: [
        " Zebra ",
        "ZEBRA",
        "ｚｅｂｒａ",
        "zebra",
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Epsilon",
        "Eta",
      ],
    }),
    post("two", { tags: ["alpha", "Beta", "Gamma", "Delta", "Epsilon"] }),
    post("three", { tags: ["Gamma"] }),
  ];
  assert.deepEqual(getBlogTags(posts), ["Gamma", "Alpha", "Beta", "Delta", "Epsilon"]);
  assert.deepEqual(getBlogTags([post("few", { tags: ["Zebra", "ZEBRA", "Alpha", "Beta"] })]), [
    "Alpha",
    "Beta",
    "Zebra",
  ]);
  assert.deepEqual(getBlogTags([]), []);
});
