# Server and browser responsibilities

The project now targets a running Next.js Node server with `output: "standalone"`. This replaces the earlier GitHub Pages/static-search recommendation following the decision to prepare for a much larger local MDX collection. No hosting deployment is performed by this code change.

## Current flow

```text
Publishing
  local MDX + translations → validate frontmatter and image references
  metadata + source lookup + popular tags + MiniSearch → .generated/blog-index.json
  next build → fixed routes + lazy article routes → standalone Node runtime

Requests
  URL criteria → server validation → indexed matching → tag/sort → count → six summaries
  article slug → metadata/source lookup → compile that article → Next.js route cache

Browser
  search draft + debounced URL updates + pagination links
  language/theme, navigation, clipboard, installation/update controls
```

The catalog is private deployment data, not a public JSON download. The server initializes metadata, MiniSearch, tag lookup, and sort ranks once per production process. Separate processes/replicas each have their own memory and caches. A client `BlogContent` receives six bilingual summaries, counts, the criteria, and up to five tag options; it receives no `allPosts` prop or search implementation.

## Archive queries

The archive reads URL parameters through asynchronous `searchParams`. Search, tag, sort, language, and page changes remain shareable and survive reload/back/forward. Pagination links use `/blog/page/2/` with the active criteria; `/blog/` is the first page.

- Queries are normalized and bounded to 160 characters and eight segmented terms. Sort values and positive pages are validated.
- MiniSearch 7.2 searches titles, descriptions, tags, slugs, and post-type words across English and Khmer. Article body text is outside this index.
- Terms use AND matching, with prefix matching for terms of at least two characters. Khmer word segmentation uses `Intl.Segmenter`.
- The server filters and sorts before slicing six results. Missing dates remain last; slug ordering resolves ties. Title ordering uses the chosen language and English fallback.
- Five popular English tags are persisted when the catalog is generated. Their labels/selection remain stable across language switches.
- A 16-entry LRU stores matching result IDs for repeated criteria. Date/title ranks and tag membership are precomputed during server initialization.
- Related posts come from bounded recent tag/type buckets, capped at eight candidates per bucket, then ranked to select at most three. This avoids scanning and ranking the entire catalog for every article.

Controls keep typing/focus, pending state, and URL navigation in the browser. Result computation remains on the server; adding `"use client"` to a component does not require sending the corpus to it.

## Article and sitemap work

The publishing pass reads sources and validates metadata, dates, translation pairing, slugs, and local covers. Bodies are not retained in the generated catalog. It does not compile every article during the build.

The detail route returns an empty `generateStaticParams()` list, accepts known slugs on demand, and uses Next.js route caching after rendering. Only the requested English/Khmer bodies are read and compiled. New articles must be opened during author preview: a metadata-valid build alone does not prove every MDX body compiles.

`/sitemap.xml` is a sitemap index. `/sitemaps/0.xml`, `/sitemaps/1.xml`, and subsequent shards contain at most 10,000 URLs apiece, including canonical archive pages and articles. The duplicate first-page archive alias is excluded.

## Deployment and offline tradeoff

The standalone artifact must include the private index, reviewed MDX sources, public assets, and traced Node dependencies. GitHub Pages cannot execute it. CI uploads a Node artifact; a Node/container host must run it. Changing content requires a matching rebuild and runtime replacement.

Live archive queries and Next.js RSC navigation require the network. The PWA precaches only four fixed shell resources and saves eligible full HTML documents/assets/images within explicit limits. It never substitutes cached HTML for RSC or search responses. See [PWA behavior](pwa-readiness.md).

## Scale evidence and limits

`npm run test:scale` constructs 50,000 synthetic bilingual metadata records and measures index generation/hydration, representative queries, result payload sizes, related selection, and heap use. It is an index/query benchmark, not a build of 50,000 real MDX files or a concurrent HTTP load test.

A local synthetic run produced these results:

| Measurement                             |            Result |
| --------------------------------------- | ----------------: |
| Synthetic metadata records              |            50,000 |
| Serialized search index                 |  12,741,837 bytes |
| Index generation                        |          1,967 ms |
| Index hydration                         |            319 ms |
| Broad English query with a tag          |         108.52 ms |
| Cached next result page                 |           0.01 ms |
| Khmer query matching all 50,000 records |          33.39 ms |
| 1,000 related-post selections           |             12 ms |
| Process heap / RSS at measurement       | 401 MiB / 527 MiB |

The memory measurement includes the synthetic fixture, serialized index, and search engine together; it is not a steady-state production memory budget. Timings describe this local fixture run, not a build of 50,000 real MDX articles or concurrent HTTP traffic. Allow headroom for the complete Node application, article compilation/cache, simultaneous requests, and replicas, then measure on the intended host before claiming capacity.

Current checks are `test:blog`, `test:scale`, `typecheck`, `build`, `check:server`, `check:pwa`, and `test:pwa`. The runtime checker samples responses, including an article; it does not compile or crawl a 50,000-article corpus.

The earlier static implementation sent every post's metadata to archive clients and removed pagination for active filters. Those findings motivated this migration and no longer describe the current query path.
