# Progressive web app with a Next.js server

The PWA now accompanies the standalone Node deployment. It retains installation and explicit update controls while limiting offline storage independently of the number of MDX posts. The former whole-site static-export precache is superseded.

## What works offline

Installation is optional. The native install action appears only when the browser offers a prompt; iPhone/iPad users receive Safari **Share → Add to Home Screen → Add** instructions. Standalone mode hides installation controls. Registration runs after page load in production secure contexts, and ordinary development does not register a worker.

Only four fixed resources are precached:

- `/offline.html`
- `/site.webmanifest`
- `/images/icon-192.png`
- `/images/icon-512.png`

Readiness means this small offline shell is installed, not that the archive or every article has been downloaded. Eligible pages and resources are saved only after requests handled by the controlling worker. They remain available only while their cache entries exist.

| Resource                                               | Strategy and limit                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Full HTML document navigation without query parameters | Network first, then saved document on connection failure; at most 16 responses, 1 MiB each, seven days.      |
| Next.js static JavaScript, CSS, and fonts              | Cache first; at most 64 responses, 2 MiB each, 30 days.                                                      |
| Same-origin images                                     | Cache first; at most 24 responses, 2 MiB each, seven days.                                                   |
| Archive queries and other query-bearing navigations    | Network only; a failed document request receives the bilingual offline fallback, rather than stale results.  |
| Next.js RSC/navigation payloads and API requests       | Network only. HTML is never substituted for route data.                                                      |
| External covers and destinations                       | Network only.                                                                                                |
| Unknown/unsaved document navigation                    | Try the network; use the offline document on connection failure. Real online 404 responses remain unchanged. |

Private/no-store, redirected, oversized, and unsuitable response types are excluded from runtime saving. Entry limits are per bucket; size limits are per response. Saved full documents may be readable through direct navigation or reload, but offline client-side Next.js navigation and live search are not guaranteed. Language/theme preferences remain in browser storage.

## Build and updates

After `next build`, `scripts/generate-pwa.mjs` uses the build ID, worker source, and fixed resources to emit `public/sw.js` and `public/pwa-assets.json`. Packaging copies these into the standalone runtime. Each shell resource has a SHA-256 integrity hash; incomplete or mixed downloads abort installation.

A new worker waits for the user's **Update and reload** action. First installation does not force a page reload. Activation clears this app's obsolete version caches, including legacy static-export caches that ignored meaningful query parameters. It leaves unrelated cache namespaces and language/theme preferences alone. Runtime pages/assets are saved again under the new version.

No bulk article, search-index, or RSC download is part of installation. Push notifications and a subscription backend are outside this implementation.

## Local verification

```sh
npm run build
npm run check:server
npm run check:pwa
npm run test:pwa
npm run preview
```

Open http://localhost:4173. Port 4173 keeps the production worker separate from development on port 3000. If reusing an origin, remove the installed production worker and app caches before testing development there.

`check:pwa` validates the shell inventory, byte count, integrity, manifest identity, real icon dimensions, and bilingual noindex fallback. Worker/client tests exercise caching and lifecycle behavior. These checks do not establish physical-device installation, standalone layout, or real browser storage behavior.

Manual acceptance still includes installation on intended browsers, direct offline access to a visited article, uncached/query/RSC failures, response-size/age/entry eviction, language/theme restoration, and updates with multiple tabs. No physical-device test or production deployment is claimed by this migration.

The earlier October static-export implementation precached all generated pages and navigation data. Its artifact counts and passing tests are historical results for that strategy, not evidence for this server-oriented worker.
