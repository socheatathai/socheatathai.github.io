# Writing articles and projects

Articles and projects share `src/content/blog/`. Start from [the article template](example.mdx) or [the project example](../src/content/blog/2026/oct/kmrs-tech.mdx); their hidden comments provide a quickstart while you edit. This page is the full authoring reference. Templates become real posts only after you copy them into the content collection.

## 1. Choose a date, filename, and slug

Use year/month folders matching the publication date. Months use lowercase three-letter names: `jan`, `feb`, `mar`, `apr`, `may`, `jun`, `jul`, `aug`, `sep`, `oct`, `nov`, `dec`.

For a post dated `2026-10-16`, these examples use:

| Kind    | English source                                  | Public URL               |
| ------- | ----------------------------------------------- | ------------------------ |
| Article | `src/content/blog/2026/oct/building-an-api.mdx` | `/blog/building-an-api/` |
| Project | `src/content/blog/2026/oct/task-board.mdx`      | `/blog/task-board/`      |

Choose a permanent `slug` that is unique across all projects and articles. Use lowercase letters, digits, and single hyphens between words. Use the same name for the source file to make it easy to find. A slug such as `building-an-api` is valid; spaces, uppercase letters, underscores, and leading or trailing hyphens are invalid.

The frontmatter slug determines the URL. Moving a source file does not change its URL when its slug stays the same. Source folders organize content; they do not set its date or become URL segments.

Create the folders you need:

```sh
mkdir -p src/content/blog/2026/oct public/images/blog/2026/oct
```

## 2. Choose an image source

For a cover, use either an existing local `/images/` file or an absolute HTTPS image URL. Store local images directly in the matching year/month folder. Keep the actual extension and use a descriptive filename:

```text
public/images/blog/2026/oct/
├── building-an-api.png       # Optional article cover
├── building-an-api-flow.png  # Optional inline image
└── task-board.png            # Required project screenshot
```

There are no per-post image folders. A shorter name such as `express-api.jpeg` is also fine. English and Khmer share the same image files. Keep profile photos, logos, and shared interface illustrations at their existing paths outside `public/images/blog/`.

The public URL omits `public/`: `public/images/blog/2026/oct/task-board.png` becomes `/images/blog/2026/oct/task-board.png`.

Add each local file before referencing it. When moving a post to another source year/month, move its local images and update their references to keep the convention consistent.

For a hosted cover, set `image` to a direct, publicly accessible HTTPS image URL, such as:

```yaml
image: "https://example.com/images/task-board.png"
```

Use the image URL itself, not a social post or page link. Hosted images load from their URL in the browser; the build does not download them.

## 3. Create the English post

Choose one of these templates. Replace the example text and links with your own content.

### Article

Save this as `src/content/blog/2026/oct/building-an-api.mdx`:

````mdx
---
slug: "building-an-api"
type: "article"
title: "Building a small API with TypeScript"
description: "How I separate routes, validation, and application logic in a small API."
date: "2026-10-16"
tags: ["API", "TypeScript"]
---

A small API is easier to maintain when each part has a clear job.

## Separate routes from application logic

Keep request handling short and move reusable behavior into a service.

```ts
type Task = { id: number; title: string };

export function findTask(tasks: Task[], id: number): Task | undefined {
  return tasks.find((task) => task.id === id);
}
```

## What I would improve next

- Validate incoming requests.
- Add tests for the important behavior.
- Document successful responses and errors.
````

An article cover is optional. After adding `public/images/blog/2026/oct/building-an-api.png`, add this line inside its frontmatter, or use a hosted image URL as shown above:

```yaml
image: "/images/blog/2026/oct/building-an-api.png"
```

The shared layout renders the cover below the title, description, and tags, so you do not need to repeat it in the body.

### Project

First add your screenshot at `public/images/blog/2026/oct/task-board.png`. Then save this as `src/content/blog/2026/oct/task-board.mdx` and replace `projectUrl` with the actual project or repository URL:

```mdx
---
slug: "task-board"
type: "project"
title: "Task Board"
description: "A task board for organizing work by status and priority."
date: "2026-10-16"
tags: ["Next.js", "PostgreSQL"]
image: "/images/blog/2026/oct/task-board.png"
projectUrl: "https://example.com/task-board"
featured: false
---

## What I built

A board that helps a small team keep track of its current work.

### Organize tasks

Create tasks and move them between planned, active, and completed work.

### Keep the interface responsive

Use a layout that works on a phone and a larger screen.

## What I learned

Keeping the data model small made the first version easier to build and maintain.
```

Projects require both an `image` (an existing local `/images/` file or an absolute HTTPS image URL) and an absolute HTTP or HTTPS `projectUrl`. The layout renders the screenshot and external project link automatically. Put the project story and features in the body.

### Frontmatter reference

| Field         | What to use                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`        | Required, permanent, unique lowercase name with hyphens.                                                                                                                                                       |
| `type`        | `article` or `project`; omitted values default to `article`. Set it explicitly in new posts.                                                                                                                   |
| `title`       | Required nonempty title.                                                                                                                                                                                       |
| `description` | Required nonempty summary used on the post and in listings and search.                                                                                                                                         |
| `date`        | Quoted valid `YYYY-MM-DD` date. Required for articles; include it on every new project too.                                                                                                                    |
| `updated`     | Optional quoted `YYYY-MM-DD` date of a meaningful content update. Requires `date` and cannot be earlier than it. Used in article metadata, structured data, and the sitemap. Keep it in the English file only. |
| `tags`        | Optional array of nonempty strings; defaults to an empty array. The five most-used English tags appear as archive filters.                                                                                     |
| `image`       | Optional article cover; required project screenshot. Use an existing local `/images/` file or a direct, publicly accessible `https://` image URL.                                                              |
| `projectUrl`  | Required for projects; an absolute `http://` or `https://` URL.                                                                                                                                                |
| `featured`    | Optional `true` or `false`. Only featured projects are eligible for the homepage.                                                                                                                              |

The archive header shows All and up to five of the most-used English tags, ranked during index generation by the number of posts using each tag, with alphabetical ordering for ties. Other tags remain searchable. Tag labels and the selected tag stay the same when switching languages; the All label is translated. The displayed tags refresh after rebuilding. The server combines tag filters with the search query, sorts the matches, and returns six results per page in every mode. Latest, Oldest, and localized Title sorting are available. Search, tag, sort, language, and pagination are preserved in the URL; clearing the controls restores All, Latest, and page one. Use Cmd/Ctrl+K to focus search and Escape to clear its query.

Posts sort newest first by frontmatter `date`, then alphabetically by slug when dates match. Older undated projects are accepted and sort after dated posts. The year/month folders do not override this ordering.

Local cover dimensions are read automatically at build time. Hosted covers do not require known dimensions, and neither image source needs width or height frontmatter fields. The same `image` is used for the cover, Open Graph and Twitter sharing images, and structured data (JSON-LD). Posts without covers use the portfolio sharing image. Set `updated` only when the content changes, rather than on every build. Publication dates, tags, and author information also appear in the post's structured data.

The homepage shows up to the first three projects with `featured: true` in that same order. An article with `featured: true` does not appear in this project section. Setting it on more than three projects makes the three newest eligible projects appear.

There is no supported `draft` or scheduled-publication setting. Every valid English post in the published catalog is included in the archive, search data, available article routes, and sitemap. A future date affects ordering; it does not delay inclusion. Keep unfinished templates outside `src/content/blog/` until they are ready to be included.

## 4. Write the body and inline images

The layout already renders the main title, so start body sections with `##`. Regular Markdown, links, lists, tables, task lists, and fenced code blocks work in MDX. Add a language name after a code fence for a readable code example and its copy button.

After adding `public/images/blog/2026/oct/building-an-api-flow.png`, insert an inline image with Markdown:

```md
![A request passes through validation, a service, and the database](/images/blog/2026/oct/building-an-api-flow.png)
```

Use readable alt text that explains what the image shows. Translate inline alt text in the Khmer body while referencing the same file. The frontmatter cover uses the localized post title as its alt text; there is no separate cover-alt metadata field.

MDX is compiled from reviewed local source when its article is first rendered, then Next.js caches the rendered route. The build validates metadata without compiling every article body. Open every new or edited article during preview to catch MDX syntax errors. Review any JSX or code you add as carefully as other project source. JavaScript expressions and dynamic imports are disabled in the compiler. Use fenced code blocks when demonstrating JavaScript, and accept MDX changes only from trusted, reviewed sources.

## 5. Add an optional Khmer translation

Place the translation beside its English source, with the same base filename and a `.km.mdx` ending:

```text
src/content/blog/2026/oct/
├── building-an-api.mdx
├── building-an-api.km.mdx
├── task-board.mdx
└── task-board.km.mdx
```

For the article, save this as `src/content/blog/2026/oct/building-an-api.km.mdx`:

```mdx
---
title: "ការបង្កើត API តូចមួយជាមួយ TypeScript"
description: "របៀបដែលខ្ញុំបែងចែក routes ការផ្ទៀងផ្ទាត់ទិន្នន័យ និងតក្កវិជ្ជាកម្មវិធីក្នុង API តូចមួយ។"
tags: ["API", "TypeScript"]
---

API តូចមួយងាយស្រួលថែទាំ នៅពេលផ្នែកនីមួយៗមានតួនាទីច្បាស់លាស់។

## បែងចែក routes ចេញពីតក្កវិជ្ជាកម្មវិធី

រក្សាការដោះស្រាយសំណើឱ្យខ្លី ហើយផ្លាស់ទីមុខងារដែលប្រើឡើងវិញបានទៅក្នុង service។

## អ្វីដែលខ្ញុំនឹងកែលម្អបន្ទាប់

- ផ្ទៀងផ្ទាត់ទិន្នន័យពីសំណើ។
- បន្ថែមការធ្វើតេស្តលើមុខងារសំខាន់ៗ។
- សរសេរឯកសារអំពីលទ្ធផល និងកំហុស។
```

For the project, use `src/content/blog/2026/oct/task-board.km.mdx`:

```mdx
---
title: "ផ្ទាំងគ្រប់គ្រងភារកិច្ច"
description: "ផ្ទាំងសម្រាប់រៀបចំការងារតាមស្ថានភាព និងអាទិភាព។"
tags: ["Next.js", "PostgreSQL"]
---

## អ្វីដែលខ្ញុំបានបង្កើត

ផ្ទាំងដែលជួយក្រុមតូចមួយតាមដានការងារបច្ចុប្បន្ន។

### រៀបចំភារកិច្ច

បង្កើតភារកិច្ច ហើយផ្លាស់ទីវារវាងការងារដែលបានគ្រោងទុក កំពុងធ្វើ និងបានបញ្ចប់។

## អ្វីដែលខ្ញុំបានរៀន

ការរក្សាគំរូទិន្នន័យឱ្យតូច ជួយឱ្យកំណែដំបូងងាយស្រួលបង្កើត និងថែទាំ។
```

Translate `title`, `description`, `tags` where appropriate, and the complete body. Technical tags can remain unchanged. Archive filter labels come from the English tags, while search includes tags from both languages. Shared fields `slug`, `type`, `image`, `projectUrl`, `featured`, and `updated` belong only in the English file; putting them in the Khmer frontmatter fails validation.

The Khmer `date` is optional. If you include it, it must exactly match the English date, such as `date: "2026-10-16"`. Both languages share the same URL and images. A Khmer file requires its sibling English file; a post without a Khmer file displays its English content when Khmer is selected.

## 6. Preview and check

Start the development server:

```sh
npm run dev
```

Open the new `/blog/<slug>/` URL at http://localhost:3000. Check the title, summary, image size, body headings, links, and code blocks. Switch languages and themes, and inspect a narrow screen. Check that the post appears in Blog search by title or tag; search uses titles, descriptions, tags, slugs, and post type in both languages, rather than body text.

Stop the development server, then run:

```sh
npm run format:check
npm run typecheck
npm run test:blog
npm run build
npm run check:server
npm run check:pwa
npm run test:pwa
npm run preview
```

The build generates the private `.generated/blog-index.json`, builds Next.js, generates the small PWA shell, and packages `.next/standalone/`. Index generation catches duplicate slugs, invalid metadata or filenames, missing project fields or local cover files, and orphan translations. It does not compile all MDX bodies. `check:server` starts a temporary production server, samples runtime responses including an article, then stops it; it does not open every article. Review each changed article, external links, and the finished layout in the browser too.

The preview runs the standalone Next.js server at http://localhost:4173, separately from development on port 3000 so its production PWA worker cannot control development pages. `npm start` runs the same standalone server on its configured port, normally 3000. Both require a completed build.

Use `npm run format` for source and Markdown documentation. MDX posts and templates are excluded so formatting does not rewrite article text or code examples.

## 7. Rebuild when content changes

A build refreshes the private catalog/search index, popular tag options, featured-project selection, and sitemap data from the same collection. Related posts show up to three posts selected from bounded recent tag/type candidates. The sitemap is split into shards of at most 10,000 URLs. No navigation list or sitemap entry needs to be maintained by hand.

To publish, add the reviewed English/Khmer files and local images, run the checks above, open the changed article, then rebuild and replace the complete standalone runtime on the Node/container host. Keep its private index, MDX sources, and public assets from the same build; the production process loads the catalog once and needs the new runtime to see published changes. Do not edit the generated index by hand or expose it under `public/`.

Set `SITE_URL` to the production origin before building; see [deployment instructions](../README.md#build-and-deploy). The workflow in `.github/workflows/nextjs.yml` validates and uploads a Node artifact. It does not deploy to GitHub Pages or publish to another host. This repository change performs no production deployment.
