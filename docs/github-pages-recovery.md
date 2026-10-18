# Recover the existing GitHub Pages website

The server migration changed the production build to `.next/standalone/` and replaced Pages deployment with server validation. That package needs a running Node.js host. Publishing the repository root through GitHub Pages does not run it: when the publishing source has no application `index.html`, Pages can render `README.md` instead.

## Restore the earlier static application

The separate **Restore GitHub Pages (static recovery)** workflow builds the last Pages-compatible application at immutable revision `ef0fc6112cd8047f69384aaff6970eba80ea7688`. It checks the generated homepage, assets, metadata, and links, then uploads **only `out/`**. The current standalone server source and its validation workflow remain intact.

This is a temporary rollback of the public website to that static revision. It does not deploy the latest server-side search, PWA implementation, or subsequent source/content changes. The current ten articles and their Khmer siblings are present in that revision, but the older archive UI is restored. Do not use this recovery workflow to evaluate the new 50,000-post architecture.

The pinned revision was built locally in an isolated directory. Its export checks passed for 19 HTML pages and ten articles, including metadata, links, and assets; all four static preview tests passed. These checks verify the recovery artifact, not a live GitHub deployment.

1. Commit this recovery workflow and merge it into the repository's default branch (`main`).
2. Open [repository Settings → Pages](https://github.com/socheatathai/socheatathai.github.io/settings/pages). Under **Build and deployment → Source**, select **GitHub Actions**, rather than publishing a source branch or `/docs` folder.
3. Open [Actions](https://github.com/socheatathai/socheatathai.github.io/actions), select **Restore GitHub Pages (static recovery)**, and choose **Run workflow** on `main`. A merge changing this workflow also starts it automatically; rerun it after correcting Pages settings if necessary.
4. Wait for both the build and deployment jobs to succeed, then reload [the website](https://socheatathai.github.io/). The homepage should show the portfolio and navigation, not this repository's Markdown documentation.

If `main` is not the default branch, use the repository's actual default branch for the merge and manual run. The automatic trigger covers `main` and `master`; manual dispatch remains available once the workflow is in the default branch. Repository environment protection can require an approval for `github-pages`; GitHub displays this on the workflow run.

No personal access token is needed in this workflow. Deployment uses the job's scoped `GITHUB_TOKEN`/OIDC permissions. Changing the Pages publishing source may require a repository administrator or maintainer. This session has no authenticated GitHub CLI access, so preparing the workflow does not itself change those live settings or publish a release.

## Finish the server migration separately

Build and deploy the current source to a Node.js/container host using the [README deployment instructions](../README.md#build-and-deploy). Configure its public `SITE_URL` before building and verify it on that host. Then decide whether to keep the old GitHub Pages site as a static snapshot or redirect it to the new public server URL. Remove the temporary recovery workflow when it is no longer needed.

Do not upload `.next/standalone/`, the repository root, or `README.md` as the GitHub Pages artifact. None is the generated static application that Pages needs.

References: [GitHub Pages entry files](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
