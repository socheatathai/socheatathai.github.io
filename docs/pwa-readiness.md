# Progressive web app on GitHub Pages and Node

The current GitHub Pages build publishes static pages with browser search. The optional standalone Node build provides server search. Both use the same install controls, explicit update flow, and bounded offline caches; neither downloads the complete archive during installation.

## What works offline

Installation is optional. The native install action appears only when the browser offers a prompt; iPhone/iPad users receive Safari **Share → Add to Home Screen → Add** instructions. Standalone mode hides installation controls. Registration runs after page load in production secure contexts, and ordinary development does not register a worker.

Only four fixed resources are precached:

- `/offline.html`
- `/site.webmanifest`
- `/images/icon-192.png`
- `/images/icon-512.png`

Readiness means this small offline shell is installed. Eligible pages and resources are saved only after requests handled by the controlling worker and remain available only while their cache entries exist.

| Resource                                                                | Strategy and limit                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Eligible public portfolio/blog HTML navigation without query parameters | Network first, then saved document on connection failure; at most 16 responses, 1 MiB each, seven days.                   |
| Next.js static JavaScript, CSS, and fonts                               | Cache first; at most 64 responses, 2 MiB each, 30 days.                                                                   |
| Same-origin `/images/` responses                                        | Cache first; at most 24 responses, 2 MiB each, seven days.                                                                |
| Query-bearing document navigation                                       | Network only; a failed document request receives the bilingual offline fallback, rather than unrelated saved results.     |
| Next.js RSC/navigation payloads and API requests                        | Network only. HTML is never substituted for route data.                                                                   |
| Browser-search metadata and chunk JSON                                  | Outside the worker's precache and runtime buckets; loading requires the network or an available browser HTTP cache entry. |
| External covers and destinations                                        | Network only.                                                                                                             |
| Unknown/unsaved document navigation                                     | Try the network; use the offline document on connection failure. Real online 404 responses remain unchanged.              |

Private/no-store, redirected, oversized, and unsuitable response types are excluded from runtime saving. Entry limits are per bucket; size limits are per response. Saved full documents may be readable through direct navigation or reload. Offline client-side Next.js navigation is not guaranteed.

On GitHub Pages, browser search can use metadata already loaded in the current tab. Further metadata/chunk requests and fresh page loads may still require a connection. The worker does not promise complete offline search. The optional Node target's server search requires connectivity. Language/theme preferences remain in browser storage.

## Builds and updates

`npm run build:pages` uses the separate `.next/` build and publishes `out/`. After export, it runs:

```sh
node scripts/generate-pwa.mjs out .next
```

This replaces any older generated worker copied from `public/` with the current static build's `out/sw.js` and `out/pwa-assets.json`.

The optional `npm run build` creates the Node deployment. Its generator defaults to `public/` and the `.next/BUILD_ID`; packaging copies the generated worker and inventory into the standalone runtime. Passing an output directory to either PWA script leaves these server defaults unchanged.

The release version includes the matching target's build ID, worker source, fixed resources, and cache policy. Each shell resource has a SHA-256 integrity hash; incomplete or mixed downloads abort installation.

A new worker waits for the user's **Update and reload** action. First installation does not force a page reload. Both targets retain `/sw.js` and the root registration scope. Activation clears this app's obsolete version caches, including legacy static-export caches that ignored meaningful query parameters. It leaves unrelated cache namespaces and language/theme preferences alone. Runtime pages/assets are saved again under the new version.

No bulk article, browser-search index, or RSC download is part of installation. Push notifications and a subscription backend are outside this implementation.

## Local verification

For the current GitHub Pages target:

```sh
npm run build:pages
npm run check:pages
npm run preview:pages
```

`check:pages` includes the PWA check for `out/`. To check only that target's PWA artifacts, run:

```sh
node scripts/check-pwa.mjs out
```

For the optional Node target:

```sh
npm run build
npm run check:pwa
npm run check:server
npm run preview
```

`npm run check:pwa` checks the default `public/` artifacts; it does not check `out/`. Run `npm run test:pwa` for shared worker/client tests, including the static-output CLI regression.

Both previews use http://localhost:4173, separately from development on port 3000. Run one preview at a time. When switching targets on that preview origin, use **Update and reload** when offered.

PWA checks validate the fixed shell inventory, byte count, integrity, bounded runtime policy, manifest identity, real icon dimensions, local resource paths, and bilingual noindex fallback. Worker/client tests exercise caching and lifecycle behavior. These checks do not establish physical-device installation, standalone layout, or real browser storage behavior.

Manual acceptance includes installation on intended browsers, direct offline access to an eligible visited article, browser-search metadata availability, uncached/query/RSC failures, response-size/age/entry eviction, language/theme restoration, and updates with multiple tabs.
