# Thai Socheata · Portfolio

A Next.js App Router portfolio built with TypeScript and React, with English and Khmer content, paper and black themes, and a static export for GitHub Pages.

## Development

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run typecheck` | Check TypeScript without building. |
| `npm run build` | Validate content, compile MDX, prerender routes, and export to `out/`. |
| `npm run preview` | Serve the existing static export at http://localhost:3000. |
| `npm start` | Alias for the static preview; run a build first. |

## Site behavior

- Home shows up to three featured projects. Articles and projects share `/blog/<slug>/` detail pages and one MDX collection.
- Blog displays six posts per page, newest first. The first page is `/blog/`; later pages use `/blog/page/2/`, and so on. Detail pages link back to their containing listing page and show up to three related posts.
- Search beside the Blog heading searches the complete archive’s titles, descriptions, tags, slugs, and post type in English and Khmer. Every search term must match. Results retain archive order; clearing the field or pressing Escape restores the current listing page and pagination. Search runs in the browser using metadata included in the static export.
- Desktop navigation can be closed and reopened; mobile navigation uses a drawer. Language and theme preferences are saved in browser storage. Mobile page transitions respect reduced-motion preferences.
- Article and project pages have a dismissible work/Ads carousel in the right rail on screens at least 1280px wide. It supports manual controls and pauses for hover, keyboard focus, and reduced-motion preferences.

## Content and structure

Follow the [step-by-step guide to writing articles and projects](docs/writing-posts.md) for copyable MDX templates, images, Khmer translations, and preview checks.

Prefer instructions inside the file? Copy [the article example](src/content/blog/2026/jan/example.mdx) or [the project example](src/content/blog/2026/oct/kmrs-tech.mdx). Their frontmatter comments and hidden MDX guide explain the fields, image paths, translations, and build steps as you edit. Matching `.km.mdx` files include translation instructions.

```text
data/content.json                 Profile, translations, and contact details
docs/writing-posts.md              Article and project authoring guide
src/
├── app/                          Pages, static blog routes, robots, and sitemap
├── components/
│   ├── layout/                   Sidebar, site shell, mobile navigation, footer
│   └── blog/                     Search, articles, related posts, work/Ads card
├── content/blog/YYYY/mon/         English .mdx and paired .km.mdx posts
├── data/                         Experience and skills adapters
├── lib/                          Content parsing, search, pagination, site metadata
└── styles/                       Shared styles and page transitions
public/
├── images/blog/YYYY/mon/          Post images directly inside month folders
├── images/                       Profile, shared, and interface images
└── ...                           Static verification and site files
scripts/preview.mjs               Local static-export server
.github/workflows/nextjs.yml       GitHub Pages build and deployment
```

Edit `data/content.json` for portfolio text and translations. Add project and article content under `src/content/blog/`. Image URLs omit `public/`, for example `/images/blog/2026/oct/express-api.jpeg`. English and Khmer share the same image files; month folders contain image files directly.

The work-card illustration’s source prompt is kept in [docs/assets/work-illustration-prompt.txt](docs/assets/work-illustration-prompt.txt).

## Deployment

`next.config.ts` enables static export, trailing-slash URLs, and static image serving. `npm run build` writes `out/`; the deployed site does not require a Next.js server. Rebuild after content changes to refresh routes, listings, search data, related posts, homepage selection, and sitemap.

The workflow in `.github/workflows/nextjs.yml` builds and deploys `out/` on pushes to `main` or `master`, or when run manually. In the repository’s **Settings → Pages**, select **GitHub Actions** as the source. Local development and preview commands do not deploy.

This configuration targets https://socheatathai.github.io. Canonical URLs and sitemap URLs use `src/lib/site.ts`.
