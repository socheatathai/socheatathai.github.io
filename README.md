# Thai Socheata · Portfolio

A Next.js App Router portfolio with TypeScript, React, English/Khmer content, paper/black themes, and a standalone Node.js server. GitHub Pages cannot run this deployment.

If the existing `socheatathai.github.io` URL shows this README, follow the [GitHub Pages recovery guide](docs/github-pages-recovery.md). Its separate recovery workflow temporarily restores the last static application while the current server version awaits Node hosting.

## Features

- Home, About, Contact, and MDX articles/projects with paired Khmer translations.
- Server-side bilingual archive search, tag filtering, latest/oldest/localized-title sorting, and six results per page.
- Shareable search and pagination URLs; five popular English tags are ranked when the private index is generated.
- Article covers from local files or direct HTTPS image URLs, shared with Open Graph, Twitter, and JSON-LD.
- Up to three featured projects and related posts chosen from bounded recent tag/type candidates.
- Responsive navigation, persistent language/theme preferences, code-copy feedback, and a desktop work/Ads carousel.
- On-demand article rendering and caching, canonical metadata, and sitemaps split into at most 10,000 URLs each.
- Production PWA installation/update controls, a bilingual offline fallback, and bounded caches for eligible visited pages and assets. Live search requires connectivity.

## Development and checks

Use Node.js 22 or newer and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Development reads local content; production uses a generated private catalog.

| Command                                   | Purpose                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Run the Next.js development server.                                                            |
| `npm run index:blog`                      | Validate metadata and generate the private catalog/search index.                               |
| `npm run build`                           | Generate the index, build Next.js, generate the PWA shell, and package the standalone runtime. |
| `npm start`                               | Run `.next/standalone/server.js`; defaults to port 3000.                                       |
| `npm run preview`                         | Run the production server on port 4173.                                                        |
| `npm run check:server`                    | Start a temporary standalone server, check runtime responses, and stop it.                     |
| `npm run check:pwa`                       | Validate the fixed offline-shell artifacts and icons.                                          |
| `npm run test:blog`                       | Test query parsing, filtering, sorting, pagination, and related-post selection.                |
| `npm run test:scale`                      | Benchmark a synthetic 50,000-record metadata index and queries.                                |
| `npm run test:pwa`                        | Test worker and client lifecycle/cache behavior.                                               |
| `npm run typecheck`                       | Check TypeScript.                                                                              |
| `npm run format:check` / `npm run format` | Check/format source and Markdown; MDX text stays unchanged.                                    |

The former static-export and custom static-preview checks are superseded by `check:server`. A synthetic index benchmark does not build 50,000 real MDX articles or measure concurrent production traffic.

## Content and architecture

Start with [the article template](docs/example.mdx) or [the project example](src/content/blog/2026/oct/kmrs-tech.mdx), then follow [the writing guide](docs/writing-posts.md).

```text
data/content.json                  Portfolio copy and translations
src/content/blog/YYYY/mon/         Reviewed English .mdx and optional .km.mdx files
public/images/blog/YYYY/mon/       Local post images, without per-post folders
.generated/blog-index.json         Private generated metadata, source lookup, tags, and MiniSearch data
src/app/                          Server routes and framework entry points
src/components/                   Rendering and interactive controls
src/hooks/                        Browser interactions and URL navigation
src/lib/blog/                     Catalog validation, server search, MDX, and sitemap logic
src/pwa/                          Service-worker source
scripts/                          Indexing, packaging, runtime checks, and tests
```

Local cover URLs omit `public/`, for example `/images/blog/2026/oct/express-api.jpeg`. Hosted covers use a direct, publicly accessible HTTPS image URL, rather than a social post/page link. Local dimensions are detected automatically; external images are loaded by the browser without a build-time download.

The server loads the private MiniSearch index once per production process. The browser receives the current result page and controls, not `allPosts` or the search corpus. Articles compile from their local MDX sources on demand and use Next.js route caching. Publishing changes requires rebuilding and replacing the runtime with its matching index, sources, and public assets.

See [server/browser responsibilities](docs/server-client-review.md), [project structure](docs/project-structure.md), [PWA behavior](docs/pwa-readiness.md), and [SEO/security notes](docs/seo-security-review.md).

## Build and deploy

Set the production origin **before building** so canonicals, social URLs, and sitemaps match the host. `.env.example` lists the settings; the default origin remains `https://socheatathai.github.io` until configured.

```sh
SITE_URL=https://portfolio.example.com npm run build
npm run check:server
npm run check:pwa
npm run test:blog
npm run test:pwa
npm run preview
```

Open http://localhost:4173. The separate preview origin keeps its production worker away from development on port 3000.

Build on the target platform or use the Docker recipe below so platform-specific dependencies match the host.

Deploy the complete `.next/standalone/` directory to a Node/container host. It includes the traced runtime, `.next/static`, `public`, the private generated index, and MDX sources. From that directory, start:

```sh
HOSTNAME=0.0.0.0 PORT=3000 node server.js
```

The included Dockerfile builds and packages the same runtime with a non-root Node.js 22 runner:

```sh
docker build --build-arg SITE_URL=https://portfolio.example.com -t socheata-portfolio .
docker run --rm -p 3000:3000 socheata-portfolio
```

Use HTTPS on the public host for PWA installation. Configure the host's port/proxy and keep the index and MDX sources outside public static serving. Build again when changing `SITE_URL` or published content.

The workflow in `.github/workflows/nextjs.yml` now validates the Node build, tests and runtime checks, then uploads a standalone artifact. It does not deploy to GitHub Pages or another host. No production deployment has been performed by this migration.

## Verification scope

The earlier October static-export reviews describe the previous architecture. Current verification must use the commands above. Browser/device installation, production traffic capacity, live hosting headers, and real Core Web Vitals need separate checks; historical static-export results do not establish them.
