# Project structure

Pages own framework exports, validated route input, and composition. Extract a module when it has a distinct responsibility, shared use, or a contract that benefits from a clear location. Small props, private helpers, and display expressions can remain beside their components.

## Server, build, and browser boundaries

| Location                       | Responsibility                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `src/app/blog/`                | Request-time archive criteria and on-demand article routes.                                                  |
| `src/lib/blog.ts`              | Server-only facade for catalog lookup, result pages, featured/related posts, and sources.                    |
| `src/lib/blog/collection.ts`   | Publishing-time discovery, frontmatter validation, translation pairing, and catalog generation.              |
| `src/lib/blog/frontmatter.ts`  | Slugs, dates, text, image references/dimensions, and project metadata.                                       |
| `src/lib/blog/search-index.ts` | Server MiniSearch hydration, sort/tag indexes, six-result queries, bounded ID cache, and related candidates. |
| `src/lib/blog/mdx.ts`          | Compile requested reviewed MDX in English and optional Khmer.                                                |
| `src/lib/blog/sitemap.ts`      | Sitemap index counts and 10,000-URL shard selection.                                                         |
| `src/lib/blog-query.ts`        | Shared criteria types, bounded URL parsing, and pagination/query links.                                      |
| `src/hooks/useBlogSearch.ts`   | Search draft, debounced URL changes, keyboard focus, and pending state.                                      |
| `src/components/blog/`         | Current-page rendering, search/filter controls, pagination, and article composition.                         |
| `.generated/blog-index.json`   | Private publishing artifact; packaged for the server, never supplied as a client prop.                       |

The generated catalog holds metadata, source paths, ranked tag options, and serialized search data. Production initializes it once per process. Only requested article bodies are loaded/compiled; the build does not eagerly compile the entire collection.

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

Site identity and the configured origin live in `lib/site.ts`; Next.js metadata builders and JSON-LD serializers remain separate. Sitemap routes are `src/app/sitemap.xml/route.ts` and `src/app/sitemaps/[id]/route.ts`.

`scripts/generate-blog-index.ts` publishes the private index. `scripts/generate-pwa.mjs` generates the fixed offline shell; `scripts/package-runtime.mjs` copies assets, index, and MDX sources into `.next/standalone/`. Runtime checks and focused tests stay in `scripts/`. CI validates/uploads the Node artifact; hosting must run Node or the included container.

Keep MDX in dated content folders and shared portfolio copy in `data/content.json`. Keep feature styles beside their components and shared styles in `styles/`. Extra service layers, barrel files, or a file for every JSX expression do not improve these boundaries.

## Verification

Run formatting, TypeScript, blog tests, the synthetic scale benchmark, production build, runtime response checks, and PWA checks/tests. `check:server` starts and stops a temporary production server. Author preview must open new articles because metadata validation does not compile every MDX body. Browser interaction and physical-device behavior require separate testing.
