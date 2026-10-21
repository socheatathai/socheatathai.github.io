# Project structure

Pages own framework exports, validated route input, and composition. Extract a module when it has a distinct responsibility, shared use, or a contract that benefits from a clear location. Small props, private helpers, and display expressions can remain beside their components.

## Server, build, and browser boundaries

| Location                       | Responsibility                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `src/app/blog/`                | Thin .static.tsx/.server.tsx entry points selected by the build target.                                      |
| `src/lib/blog.ts`              | Server-only facade for catalog lookup, result pages, featured/related posts, and sources.                    |
| `src/lib/blog/collection.ts`   | Publishing-time discovery, frontmatter validation, translation pairing, and catalog generation.              |
| `src/lib/blog/frontmatter.ts`  | Slugs, dates, text, image references/dimensions, and project metadata.                                       |
| `src/lib/blog/search-index.ts` | Server MiniSearch hydration, sort/tag indexes, six-result queries, bounded ID cache, and related candidates. |
| `src/lib/blog/mdx.ts`          | Compile requested reviewed MDX in English and optional Khmer.                                                |
| `src/lib/blog/sitemap.ts`      | Sitemap index counts and 10,000-URL shard selection.                                                         |
| `src/lib/blog-query.ts`        | Shared criteria types, bounded URL parsing, and pagination/query links.                                      |
| `src/hooks/useBlogSearch.ts`   | Search draft, debounced URL changes, keyboard focus, and pending state.                                      |
| `src/components/blog/`         | Current-page rendering, search/filter controls, pagination, and article composition.                         |
| `out/blog-search/<revision>/`  | Public bounded metadata chunks generated only for Pages browser search.                                      |
| `.generated/blog-index.json`   | Private publishing artifact; packaged for the server, never supplied as a client prop.                       |

The generated catalog holds metadata, source paths, ranked tag options, and serialized search data. Production initializes it once per process. The Node target loads/compiles requested article bodies on demand. The Pages target compiles every article during export and writes public summary chunks separately; it does not publish the private catalog.

## Types and UI contracts

Domain models live in `src/types/blog.ts`; blog UI contracts stay in `src/components/blog/types.ts`. The archive contract contains one result page:

```ts
export type BlogContentProps = BlogPageData & {
  criteria: BlogQuery;
  tags: string[];
  archiveTotal: number;
};
```

It has no `allPosts` field. Client components import models with `import type`, independently of the filesystem and MiniSearch modules. `src/lib/blog.ts` uses `server-only` to enforce that boundary.

Layout props/icons remain near layout components; shared language/theme values and provider contracts live in `src/types/`. Preference hooks own browser storage and document updates. Providers expose context; `lib/theme.ts` shares bootstrap and runtime theme settings.

Keep clipboard timers, mobile-dialog focus, sidebar disclosure, carousel state, and PWA browser lifecycle in their focused hooks. Home/About reuse skills, experience, and education components. Small contact/footer/not-found components remain together.

## Metadata and deployment

Site identity and the configured origin live in `lib/site.ts`; Next.js metadata builders and JSON-LD serializers remain separate. Sitemap routes are `src/app/sitemap.xml/route.ts` and `src/app/sitemaps/[id]/route.ts`; all known shards are generated during publishing.

`scripts/generate-blog-index.ts` publishes the private index. `scripts/generate-pwa.mjs` generates the fixed offline shell; `scripts/package-runtime.mjs` copies assets, index, and MDX sources into `.next/standalone/`. `scripts/build-pages.mjs` selects the export route variants, generates versioned browser-search chunks, and writes the Pages PWA into `out/`. `.github/workflows/pages.yml` publishes that current-source artifact after checks. The separate server workflow validates/uploads the optional Node artifact. Runtime/artifact checks and focused tests stay in `scripts/`.

Keep MDX in dated content folders and shared portfolio copy in `data/content.json`. Keep feature styles beside their components and shared styles in `styles/`. Extra service layers, barrel files, or a file for every JSX expression do not improve these boundaries.

## Verification

Run formatting, TypeScript, blog/PWA tests, `build:pages`, and `check:pages` for the current Pages target. Run the synthetic scale benchmark, `build`, `check:server`, and `check:pwa` for the optional Node target. `check:server` starts and stops a temporary production server. Pages export compiles all article bodies; Node author preview must open new articles because catalog validation alone does not compile their MDX. Browser interaction and physical-device behavior require separate testing.
