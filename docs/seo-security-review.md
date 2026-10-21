# SEO and security review

The current GitHub Pages target exports the latest source with browser-side search. The optional standalone Node target retains server-side search and on-demand article rendering. Historical live-site/header inspection and dependency audits were point-in-time observations; they do not establish current device behavior, security headers, or traffic capacity.

## Current SEO behavior

- Public pages use branded titles, descriptions, canonical URLs, and Open Graph/Twitter images.
- Article covers also supply article JSON-LD images; posts without covers use the shared portfolio image.
- Article and breadcrumb structured data include truthful publication/modification dates, tags, and author details. The serializer escapes `<` before insertion into a script.
- Archive canonicals use clean page paths. Node search variants receive request-time `noindex, follow` metadata and six server-rendered results. Pages initially serves the default static archive HTML; JavaScript applies search variants, so metadata cannot vary at the HTTP server by query string.
- `robots.txt` advertises `/sitemap.xml`, now a sitemap index. Each `/sitemaps/<id>.xml` shard contains at most 10,000 URLs. The duplicate first-page archive alias is excluded.
- Unknown slugs/pages produce not-found responses; the offline fallback is separately marked noindex.

Set `SITE_URL` to the intended public HTTP(S) origin before building. The Pages target uses `https://socheatathai.github.io`; deploying the Node server elsewhere without configuring it would advertise the wrong canonical/social/sitemap origin. Paths, credentials, queries, and fragments are rejected in this setting.

English/Khmer continue to share article paths. Archive `lang` controls result ordering and reader state, while article metadata remains English; this does not implement separate translated canonicals or hreflang routes.

## Server and content boundaries

The private `.generated/blog-index.json` and reviewed MDX files are packaged for Node, outside `public/`. The Node browser receives one result page; production hydrates the private catalog once per process and uses bounded query caches. Pages also starts with one result page, then fetches whitelisted summary metadata from versioned public chunks for browser filtering/search. It never publishes source paths, article bodies, or the serialized private engine in those chunks.

Slugs map to validated catalog source paths rather than becoming arbitrary filesystem input. Publishing validates duplicate slugs, translation pairing, dates, symlinks, local image existence/dimensions, and metadata. Query text is length/term bounded; sort/page/language values are normalized. No database, visitor upload, authentication, or contact-form backend is introduced.

Node MDX compiles on first article rendering. Pages export compiles the entire collection during publishing. Expressions and dynamic imports remain disabled. MDX can still contain JSX, so reviewed repository content is a trust boundary; arbitrary visitor submissions or unreviewed remote MDX must not enter this compiler. Open new articles in preview to detect body syntax errors.

Local covers must be normalized existing `/images/` paths. Hosted covers require direct HTTPS URLs without credentials and are not fetched during builds. Project links allow HTTP(S); external blank-target links include `noopener noreferrer`.

Browser storage retains language/theme preferences. The worker caches only eligible public responses, rejects private/no-store content, and keeps live search/RSC requests network-only; it cannot replace server results with stale pathname-only HTML. See [PWA behavior](pwa-readiness.md).

## Hosting and maintenance

The included container uses a non-root Node.js 22 runner. The complete standalone artifact includes server dependencies, sources, private index, and public assets. Serve only its public assets through static hosting rules; do not expose private runtime directories.

The Pages workflow builds/checks `out/` from the current commit and publishes it through GitHub Actions. A source-setting guard rejects branch publishing, which could overwrite the app with the README. The server workflow separately validates/uploads a Node artifact and does not configure a Node host. HTTPS, reverse-proxy behavior, response headers, logs, and cache persistence must be checked on the chosen host. The previous GitHub Pages HSTS/header observations do not carry over automatically. Test any CSP with Next.js hydration scripts before enforcing it.

The earlier review also introduced commit-pinned workflow actions, nonpersistent checkout credentials, Dependabot configuration, accurate local cover dimensions, square icons, a smaller profile photo, and safe JSON-LD serialization. Keep those protections while updating dependencies. No fresh vulnerability count is asserted for the new lockfile; use `npm audit` for a current advisory check.

## Verification

```sh
npm run format:check
npm run typecheck
npm run test:blog
npm run test:scale
npm run build:pages
npm run check:pages
# Optional Node target:
npm run build
npm run check:server
npm run check:pwa
npm run test:pwa
```

The runtime checker starts a temporary standalone server and samples HTML/metadata, articles, search/pagination, assets, sitemap responses, and private-path behavior. It does not compile every real MDX file, inspect external destinations, or prove production traffic capacity. The synthetic 50,000-record test benchmarks metadata indexing/querying, not 50,000 real article renders.

The current `check:pages` verifies the new static artifact, including all article pages, assets, sitemaps, and browser-search chunks. Historical `check:export` results refer to the older recovery source. Browser/device accessibility, installation, actual indexing, hosting headers, and Core Web Vitals still need checks against the chosen deployed target. Publish content using [the writing guide](writing-posts.md), then rebuild and publish the matching artifact.
