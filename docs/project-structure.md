# Project structure review

Pages should describe the route and compose its content. Extract code when it has its own responsibility, is reused, or makes the surrounding file difficult to scan. A small props declaration or display expression in a component is also normal production code; a separate file is useful when it makes the contract easier to find and maintain.

## Types and props

| Location                              | Responsibility                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `src/types/blog.ts`                   | Blog content models and the `BlogPageData` pagination result.                 |
| `src/components/blog/types.ts`        | Blog UI contracts, including `BlogContentProps`, derived from `BlogPageData`. |
| `src/components/layout/types.ts`      | Layout, navigation action, icon, and link props.                              |
| `src/types/language.ts`, `theme.ts`   | Preference values and provider contracts.                                     |
| `src/types/portfolio.ts`, `routes.ts` | Portfolio component props and asynchronous blog route params.                 |

The original blog props now reuse the data contract:

```ts
export type BlogContentProps = BlogPageData & {
  allPosts: BlogPostMetadata[];
};
```

Client components import blog models with `import type` from `@/types/blog`, independently of the filesystem loader. Derive related contracts with `Pick`, `Omit`, or intersections instead of repeating fields. Keep feature-specific props near their components rather than putting every type in one global file.

## Pages and server code

| Area                             | Decision                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, about, contact             | Keep route metadata exports and content composition in the page. Rendering belongs to their content components.                               |
| Blog index and paginated archive | Keep static route exports in the pages; share metadata and validated archive lookup through libraries.                                        |
| Blog article                     | Keep params, static generation, and metadata in the route. `BlogPostContent` composes the article, related posts, promo, and structured data. |
| Root layout                      | Keep the document and provider tree here. Import the metadata and theme bootstrap configuration.                                              |
| Not found, robots, sitemap       | Keep these small framework entry points together. They already have one clear responsibility.                                                 |

`src/lib/blog.ts` is the query API for posts, featured projects, related posts, and pagination. Its supporting modules have narrower jobs:

- `blog/collection.ts` discovers and reads the local MDX collection and pairs translations.
- `blog/frontmatter.ts` validates metadata, dates, image paths and dimensions, and project links.
- `blog/sort.ts` shares the ordering used by the archive and related posts.
- `blog/mdx.ts` compiles both article languages with the existing MDX restrictions.
- `blog/routes.ts` turns invalid or missing route input into a not-found response.

Filesystem access and MDX compilation stay on the server. Keep `"use client"` on interactive components and hooks; shared models and pure formatting functions do not need it.

Site identity is in `lib/site.ts`, Next.js metadata builders are in `lib/metadata.ts`, and JSON-LD builders and serialization are in `lib/structured-data.ts`. These are separate formats with different consumers.

## UI and interaction

| Area                         | Extracted responsibility                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blog search                  | `useBlogSearch` owns query state, matching, clearing, and input focus.                                                                                     |
| Code copy button             | `useCopyCode` owns clipboard status and timer cleanup.                                                                                                     |
| Article promo                | `useArticlePromo` owns rotation, pause, focus, dismissal, and media preferences.                                                                           |
| Language and theme providers | Preference hooks own browser storage and synchronization; providers expose typed context. Theme bootstrap and runtime application share `lib/theme.ts`.    |
| Sidebar and mobile header    | Shared navigation links, language control, profile/social rendering, and icons have dedicated components; navigation hooks own focus and responsive state. |
| Home and about               | Reuse `SkillsList` and `ExperienceTimeline`; education rendering has its own component.                                                                    |

Pure search, pagination, date, and number formatting remain in `lib/`, where they can be used without mounting a component.

## Code kept together

- Keep short presentational components such as contact content, footer, skip link, theme toggle, and the not-found message focused in their existing files.
- Keep one-use icon helpers, simple props such as `{ posts: BlogPostMetadata[] }`, and short label expressions beside their UI when a separate module would add navigation without a useful boundary.
- Keep a file's private parsing helpers and normalization details local unless another module needs them.
- Keep CSS modules beside their feature and shared styles in `styles/`; this refactor does not require a styling reorganization.
- Keep MDX posts and translations in the existing dated content folders, and shared portfolio copy in `data/content.json`.
- Keep the preview server, its tests, and export checks in `scripts/`, and deployment configuration in `.github/`.

There is no need for a generic service/repository hierarchy, a file for every JSX section, or barrel files that hide the server/client import boundary at this project size.

## Verification

Run `npm run format:check`, `npm run typecheck`, `npm run build`, `npm run check:export`, and `npm run test:preview`. The build parses all content and compiles both languages; the export check inspects generated pages, metadata, structured data, links, and assets. After changing interaction hooks, also exercise search, language/theme switching, and responsive navigation in a browser.
