# GitHub Pages publishing and recovery

The current website is published from the latest source by `.github/workflows/pages.yml`. Its build runs `npm run build:pages` and uploads only `out/`. The earlier recovery workflow that checked out a frozen older revision has been removed.

## Required repository setting

Open [Settings → Pages](https://github.com/socheatathai/socheatathai.github.io/settings/pages). Under **Build and deployment → Source**, select **GitHub Actions**. Keep this setting when pushing new commits.

Publishing `main / (root)` instead starts GitHub's Jekyll build. Since the repository contains source code rather than an application `index.html`, that build can publish `README.md` and overwrite a successful custom deployment. The current deployment job checks the setting and stops with a clear error if it has changed.

## Publish the latest version

1. Push or merge changes into `main`. Every push starts **Publish current website to GitHub Pages**; pull requests validate without publishing.
2. Open [Actions](https://github.com/socheatathai/socheatathai.github.io/actions) and wait for the build and deployment jobs to succeed. You can also run this workflow manually on `main`.
3. Open [the blog](https://socheatathai.github.io/blog/). It should have the current tag filters and sort control. [build-info.json](https://socheatathai.github.io/build-info.json) records the deployed commit and content revision.

A failed build or test skips deployment and leaves the existing published artifact in place. There is no automatic rollback after a successful deployment containing a bug. Fix the source and deploy it, or revert the relevant commit and let the workflow build again. Repository environment protection may require approval for `github-pages`; GitHub displays this on the workflow run.

## Local checks

```sh
npm ci
npm run build:pages
npm run check:pages
npm run preview:pages
```

Open http://localhost:4173. The artifact includes current articles, their translations, versioned summary chunks for browser search, and the PWA shell. Search/filter/sort run in the browser because GitHub Pages has no application server. All article routes are generated during the build; large archives increase build and metadata-scan costs.

The optional `npm run build` target still packages a Node.js server with server-side search and on-demand article rendering. See the [README](../README.md#optional-nodejs-server). It is a separate deployment target.

References: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [entry files](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), and [job dependencies](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds).
