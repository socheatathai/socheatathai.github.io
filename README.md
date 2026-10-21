# Thai Socheata · Portfolio

A Next.js portfolio with TypeScript, React, English/Khmer content, paper/black themes, and a PWA. The live `socheatathai.github.io` website uses a static build of the current source. An optional Node.js build retains server-side search for a larger archive.

## GitHub Pages

GitHub manages the repository and publishes the latest `main` through `.github/workflows/pages.yml`. Set **Settings → Pages → Source → GitHub Actions**. Publishing `main / (root)` can replace the application with the README.

```sh
npm ci
npm run build:pages
npm run check:pages
npm run preview:pages
```

Open http://localhost:4173. The Pages build writes `out/`; it includes the current blog design, up to five popular tag filters, sort controls, six results per page, right-aligned article links, and all current articles/translations. Every article is compiled at build time. Search/filter/sort run in the browser because GitHub Pages has no Node.js application server.

Initial HTML contains one result page. Interactive searches load versioned metadata chunks, each limited to 128 records and 128 KiB. The browser scans matching metadata and retains a bounded chunk cache rather than receiving `allPosts` in page props. This still costs more network traffic and build time as the collection grows; use the Node target for an archive approaching 50,000 posts. The synthetic server benchmark does not establish static-build capacity or browser performance at that size.

The Pages workflow validates before deployment. A failed build leaves the currently published site in place; automatic rollback after a successful but faulty deployment is not configured. The former workflow pinned to an older recovery commit is removed. `/build-info.json` records the deployed commit and content revision. See [publishing and recovery](docs/github-pages-recovery.md).

## Development and features

Use Node.js 22 or newer. `npm run dev` opens the Next.js development server at http://localhost:3000; shared components/styles are used by both targets. Preview the Pages build before publication to verify browser search.

- Home, About, Contact, and dated MDX articles/projects with paired Khmer translations.
- Bilingual search, tag filtering, latest/oldest/localized-title sorting, shareable URLs, and pagination.
- Local or direct HTTPS article covers used by Open Graph, Twitter, and article JSON-LD.
- Featured and related projects/posts, responsive navigation, language/theme preferences, and code-copy feedback.
- Split sitemaps, canonical metadata, install/update controls, and a bounded offline PWA shell.

| Command                                   | Purpose                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                             | Run the development server.                                              |
| `npm run build:pages`                     | Generate the index and current static application in `out/`.             |
| `npm run check:pages`                     | Check exported pages, search chunks, metadata, links, and PWA artifacts. |
| `npm run preview:pages`                   | Serve `out/` locally on port 4173.                                       |
| `npm run build`                           | Build and package the optional standalone Node.js server.                |
| `npm start` / `npm run preview`           | Start that Node build on port 3000 / 4173.                               |
| `npm run check:server`                    | Check a temporary standalone server and stop it.                         |
| `npm run check:pwa`                       | Check the server target's generated `public/` PWA artifacts.             |
| `npm run test:blog` / `npm run test:pwa`  | Run focused search/control and PWA tests.                                |
| `npm run test:scale`                      | Benchmark a synthetic 50,000-record server metadata index.               |
| `npm run typecheck`                       | Run the project's TypeScript 7 CLI.                                      |
| `npm run format:check` / `npm run format` | Check or format source and Markdown.                                     |

Tests that transpile fixtures use the official TypeScript 6 compatibility API; the project CLI remains TypeScript 7. This avoids relying on the compiler API removed from the TypeScript 7 package root.

## Content and structure

Start with [the article template](docs/example.mdx) or [the project example](src/content/blog/2026/oct/kmrs-tech.mdx), then follow [the writing guide](docs/writing-posts.md).

```text
data/content.json                  Portfolio copy and translations
src/content/blog/YYYY/mon/         English MDX and optional Khmer siblings
public/images/blog/YYYY/mon/       Local cover images
src/app/                          Thin framework routes; .static/.server archive variants
src/components/                   Shared UI and article composition
src/hooks/                        Focused browser interactions
src/lib/blog/                     Catalog, server search, and MDX compilation
.generated/blog-index.json         Private build/server catalog; never published directly
out/blog-search/<revision>/        Public summary chunks for the Pages target only
src/pwa/                          Service-worker source
scripts/                          Target builds, generators, checks, and tests
```

Local cover paths omit `public/`, for example `/images/blog/2026/oct/express-api.jpeg`. Hosted images must be direct publicly accessible HTTPS image URLs. Local dimensions are detected during catalog generation; external images are not downloaded at build time.

See [project structure](docs/project-structure.md), [server/browser responsibilities](docs/server-client-review.md), [PWA behavior](docs/pwa-readiness.md), and [SEO/security notes](docs/seo-security-review.md).

## Optional Node.js server

This target keeps the private MiniSearch index on the server, returns only six summaries per request, and compiles articles on demand. It remains available for a larger collection or a future host migration. It cannot be published as a GitHub Pages artifact.

```sh
SITE_URL=https://portfolio.example.com npm run build
npm run check:server
npm run check:pwa
npm run preview
```

Deploy the complete `.next/standalone/` directory to a Node/container host and start it with `HOSTNAME=0.0.0.0 PORT=3000 node server.js`. It contains the matching index, sources, dependencies, and public assets. Build again when content or `SITE_URL` changes.

```sh
docker build --build-arg SITE_URL=https://portfolio.example.com -t socheata-portfolio .
docker run --rm -p 3000:3000 socheata-portfolio
```

The container uses a non-root Node.js 22 runner. `.github/workflows/nextjs.yml` validates and uploads this server artifact; it does not deploy a Node host. Both targets use Next's generated `.next/` workspace; run the selected build before previewing its artifact. HTTPS is required for public PWA installation.

## Verification limits

Artifact checks and unit tests do not establish physical-device behavior, production concurrency, real 50,000-article build performance, or Core Web Vitals. Static search requires its metadata downloads; offline support covers the fixed shell and eligible visited content rather than the whole archive.
