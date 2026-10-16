# Thai Socheata · Portfolio

A Next.js App Router portfolio built with TypeScript and React, with English and Khmer content, paper and black themes, and a static export for GitHub Pages.

## Development

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

| Command                | Purpose                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Start the development server.                                               |
| `npm run format`       | Format source and documentation; MDX posts and templates stay unchanged.    |
| `npm run format:check` | Check formatting without changing files.                                    |
| `npm run typecheck`    | Check TypeScript without building.                                          |
| `npm run build`        | Validate content, compile MDX, prerender routes, and export to `out/`.      |
| `npm run check:export` | Check built metadata, structured data, sitemap, images, and internal links. |
| `npm run test:preview` | Check the local preview server, including unsafe redirect paths.            |
| `npm run preview`      | Serve the existing static export at http://localhost:3000.                  |
| `npm start`            | Alias for the static preview; run a build first.                            |

## Content and structure

To add a post, copy [the article template](docs/example.mdx) or [the project example](src/content/blog/2026/oct/kmrs-tech.mdx). Each has a short editor-only guide inside the MDX file. The [authoring reference](docs/writing-posts.md) covers all fields, images, Khmer translations, and publishing checks.

```text
data/content.json                 Portfolio text, translations, and contact details
docs/writing-posts.md              Article and project authoring guide
src/
├── app/                          Pages, static blog routes, robots, and sitemap
├── components/
│   ├── layout/                   Sidebar, site shell, mobile navigation, footer
│   └── blog/                     Search, articles, related posts, work/Ads card
├── content/blog/YYYY/mon/         English .mdx and paired .km.mdx posts
├── hooks/                        Search, clipboard, preferences, and navigation behavior
├── lib/                          Queries, formatting, navigation, metadata, structured data
│   └── blog/                     Collection loading, frontmatter validation, MDX, route lookup
├── types/                        Shared blog, language, theme, portfolio, and route contracts
└── styles/                       Shared styles and page transitions
public/
├── images/blog/YYYY/mon/          Post images directly inside month folders
├── images/                       Profile, shared, and interface images
└── ...                           Static verification and site files
scripts/                         Export checks, preview server, and server tests
.github/workflows/nextjs.yml       GitHub Pages build and deployment
```

Edit `data/content.json` for profile text, experience, skills, contact details, and translations. Shared page navigation lives in `src/lib/navigation.ts`. The [project structure review](docs/project-structure.md) explains which code belongs in pages, components, hooks, types, and libraries, and which small pieces should stay together.

Post images go directly in `public/images/blog/YYYY/mon/`, with no per-post folder. Their URLs omit `public/`, for example `/images/blog/2026/oct/express-api.jpeg`. English and Khmer reuse the same files.

Blog shows six posts per page and searches the full archive in both languages. Home shows up to three featured projects; post pages include related posts and a desktop work/Ads card. Language and theme preferences are saved in browser storage.

The work-card illustration’s source prompt is kept in [docs/assets/work-illustration-prompt.txt](docs/assets/work-illustration-prompt.txt).

## Deployment

`next.config.ts` enables static export, trailing-slash URLs, and static image serving. `npm run build` writes `out/`; the deployed site does not require a Next.js server. Rebuild after content changes to refresh routes, listings, search data, related posts, homepage selection, and sitemap.

The workflow in `.github/workflows/nextjs.yml` builds and deploys `out/` on pushes to `main` or `master`, or when run manually. In the repository’s **Settings → Pages**, select **GitHub Actions** as the source. Local development and preview commands do not deploy.

This configuration targets https://socheatathai.github.io. Canonical URLs and sitemap URLs use `src/lib/site.ts`.

## SEO and security

See [the SEO and security review](docs/seo-security-review.md) for the checked areas, implemented fixes, hosting limits, and remaining account settings. Pull requests run type checking, the production build, export checks, and preview server tests. Only pushes and manual runs deploy. Dependabot checks npm dependencies weekly and GitHub Actions monthly.
