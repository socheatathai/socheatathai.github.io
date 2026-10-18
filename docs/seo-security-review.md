# SEO and security code review

Reviewed on 2026-10-16. Scope: application routes and components, local MDX and frontmatter handling, public assets, the static preview server, locked dependencies, and the GitHub Pages workflow. The public site was also checked for HTTPS, the deployed application, and response headers. This is a source and configuration review, not a penetration test or a guarantee against future vulnerabilities. Repository account settings and Google Search Console were not accessible.

## Result

The project has a sound foundation for a small static portfolio: content is prerendered into HTML, public pages have canonical URLs and descriptions, articles are linked through the archive, and robots.txt advertises the sitemap. The deployed site now serves the Next.js application, rather than the README. HTTP redirects to HTTPS and the host sends HSTS.

No high-impact exploitable issue was identified in the reviewed application code. The npm advisory check reported **0 known vulnerabilities** for the final lockfile. This is a point-in-time dependency result; it does not prove all source code is vulnerability-free.

## Fixes implemented

| Finding                                                                                          | Change                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every article shared the same portfolio preview image.                                           | Article Open Graph and Twitter metadata now use the post's cover, with the portfolio image as a fallback. Tags and author information are included.                                                                       |
| Blog posts had no article or breadcrumb structured data.                                         | Added JSON-LD `BlogPosting` and `BreadcrumbList`, using the same title, description, image, URL, author, tags, and publication date as the post. JSON is escaped before insertion into HTML.                              |
| The home title omitted the developer's name; generated error pages inherited indexable metadata. | Added an explicit branded home title and dedicated 404 title, description, and `noindex` metadata.                                                                                                                        |
| Cover images reserved an incorrect fixed 1400×850 ratio.                                         | The build reads actual image dimensions automatically, including JPEG orientation. Authors do not need to manage width/height fields.                                                                                     |
| The shared profile photo was 3,155,444 bytes, despite appearing at small display sizes.          | Resized and compressed it to 87,941 bytes, preserving its displayed orientation. Also reduced the two education logos.                                                                                                    |
| The manifest advertised a square icon using a nonsquare photo.                                   | Added actual 192×192 and 512×512 icons; favicon/apple metadata and the manifest reference the square assets.                                                                                                              |
| The local preview could redirect an encoded path such as `/%2fblog` to `//blog/`.                | Reject network-path and backslash variants, encode redirect path segments, and preserve query parameters. The server still listens only on localhost. Production GitHub Pages was unaffected by this local-preview issue. |
| Security defaults in MDX were implicit; workflow action versions were mutable tags.              | Explicitly disabled MDX expressions and dynamic imports. Pinned actions to verified commit hashes and disabled persisted checkout credentials.                                                                            |
| Changes were built only after a push, without export checks.                                     | Pull requests now run TypeScript, a production build, exported-page checks, and preview regression tests. Pull requests cannot enter the deployment job.                                                                  |
| Dependency maintenance was manual.                                                               | Added weekly npm and monthly GitHub Actions Dependabot update configuration. Updates open reviewable PRs; there is no automatic merge.                                                                                    |

The optional English frontmatter field `updated: "YYYY-MM-DD"` now supplies truthful modification dates to article metadata, structured data, and the sitemap. It must not precede `date`. Existing posts do not receive fabricated modification timestamps on each build.

## Security properties checked

- Public slugs are validated and looked up in a parsed collection; request text does not become a filesystem path. Duplicate slugs, content symlinks, invalid publication dates, missing images, and malformed metadata fail the build.
- Frontmatter images must use existing normalized local `/images/` paths. Project links are restricted to absolute HTTP or HTTPS URLs. Rendered blank-target project and social links use `noopener noreferrer`.
- MDX comes only from the repository and is compiled at build time. `next-mdx-remote` 6.0.0 contains the fix for [HCSEC-2026-01](https://discuss.hashicorp.com/t/hcsec-2026-01-arbitrary-code-execution-in-react-server-side-rendering-of-untrusted-mdx-content/77155); expressions and dynamic imports remain disabled explicitly. MDX can still contain JSX, so repository write access and review are a trust boundary. Do not compile arbitrary visitor submissions or unreviewed remote MDX.
- JSON-LD uses a shared serializer that escapes `<`, preventing content from terminating its script element. The theme initialization script contains fixed application code, rather than user input.
- Browser storage contains only language/theme preferences, validated against known values. No passwords or authentication tokens are stored there.
- No API routes, authentication system, database connection, server actions, upload endpoint, or contact-form backend are deployed. The GitHub Pages artifact contains static assets, not the build-time Node.js application.
- No tracked `.env` files or matches for the scanned private-key/common-token patterns were found. Public email addresses and Google verification IDs are intended public information. This was a tracked-file scan, not a complete Git history secret audit.
- Workflow credentials remain read-only during the build; Pages write and OIDC permissions are scoped to the deployment job. Actions are pinned as [recommended by GitHub](https://docs.github.com/en/actions/reference/security/secure-use). Builds of pull requests have no deployment step.

## Remaining improvements and hosting limits

1. **Khmer search visibility:** the initial HTML and metadata are English, while the language button switches content at the same URL. Khmer is available to readers, but it does not have independently addressable, indexable pages. If Khmer search traffic matters, a separate `/km/` route tree with translated metadata, canonicals, and reciprocal `hreflang` links is the next substantial SEO improvement. Do not point English and Khmer hreflang entries at the same URL. [Google recommends separate URLs for language versions.](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
2. **Security response headers:** the live GitHub Pages response included HSTS but no CSP, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, or HTTP Referrer-Policy. The app now declares a referrer policy through HTML metadata. Custom Next.js response headers are [unsupported in a static export](https://nextjs.org/docs/app/guides/static-exports#unsupported-features); adding `headers()` would not secure this deployment. A strict CSP and framing policy require a hosting/proxy configuration that can send those headers, plus testing with Next.js hydration scripts. This is additional hardening for this public static site, rather than evidence of an active injection vulnerability.
3. **Repository settings:** verify Dependabot alerts/security updates and secret scanning/push protection are enabled where available. Consider requiring the build check before merging. These settings were not changed or verified through the local repository.
4. **Indexing and real-world performance:** submit `https://socheatathai.github.io/sitemap.xml` in Google Search Console and use URL Inspection after deployment. Test representative home/article pages in PageSpeed Insights to measure real Core Web Vitals. A passing static check cannot establish rankings, indexing status, or a Lighthouse score. [Google's article documentation](https://developers.google.com/search/docs/appearance/structured-data/article) describes the structured data fields and external validation tools.

## Verification and maintenance

```sh
npm ci
npm run typecheck
npm run build
npm run check:export
npm run test:preview
npm audit
```

The export check verifies titles/descriptions, one H1 per content page, canonical URLs, Open Graph/Twitter images, error-page noindex directives, article and breadcrumb JSON-LD, sitemap targets, and local navigation/assets. The sitemap deliberately excludes the duplicate first-page alias `/blog/page/1/`, which canonicals to `/blog/`.

Preview tests cover normal redirects, query preservation, HEAD requests, encoded network paths, backslashes, traversal, malformed encoding, missing pages, MIME types, and unsupported methods. They require permission to listen on a temporary localhost port. These checks inspect generated files and local behavior; they do not crawl external project destinations or run a real browser accessibility/performance audit.

Rebuild and deploy after changing metadata or content. Follow [the writing guide](writing-posts.md) and [the inline MDX example](example.mdx) for publishing new content and images. Keep templates outside the content collection until ready to publish.
