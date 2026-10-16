"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import type { BlogPostMetadata } from "@/lib/blog";
import { formatBlogDate, localizedBlogText } from "./blogText";

type Props = {
  metadata: BlogPostMetadata;
  children: ReactNode;
  khmerContent?: ReactNode;
  backHref?: string;
};

/** MDX is compiled on the server; only its rendered language is selected here. */
export default function BlogArticle({ metadata, children, khmerContent, backHref = "/blog/" }: Props) {
  const { language, content } = useLanguage();
  const km = language === "km";
  const translated = km && Boolean(metadata.km && khmerContent);
  const text = localizedBlogText(metadata, language);
  const isProject = metadata.type === "project";
  const isGitHub = metadata.projectUrl ? new URL(metadata.projectUrl).hostname === "github.com" : false;

  return (
    <article className={`blog-detail${isProject ? " project-article" : ""}`} lang={translated ? "km" : "en"}>
      <Link className="text-link back-link" href={backHref} direction="back">← {km ? "អត្ថបទទាំងអស់" : "All posts"}</Link>
      <header className="page-header">
        <div className="blog-meta">
          {isProject && <><span>{km ? "កំណត់ត្រាគម្រោង" : "Project notes"}</span><span aria-hidden="true">·</span><span>{km ? "ដោយ" : "By"} {content.logo}</span></>}
          {isProject && metadata.date && <span aria-hidden="true">·</span>}
          {metadata.date && <time dateTime={metadata.date}>{formatBlogDate(metadata.date, language)}</time>}
        </div>
        <h1>{text.title}</h1>
        <p className="lead">{text.description}</p>
        <ul className="tag-list" aria-label={isProject ? (km ? "បច្ចេកវិទ្យា និងប្រធានបទ" : "Technologies and topics") : (km ? "ប្រធានបទ" : "Topics")}>
          {text.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      </header>
      {metadata.image && (
        <figure className="blog-article-figure">
          <Image src={metadata.image} alt={text.title} width={1400} height={850} priority sizes="(max-width: 767px) 100vw, 780px" />
          {isProject && <figcaption>{km ? "រូបភាពបង្ហាញផ្ទៃប្រើប្រាស់របស់គម្រោង។" : "A preview of the project interface."}</figcaption>}
        </figure>
      )}
      <div className="prose blog-detail-body">
        {translated ? khmerContent : children}
        {isProject && metadata.projectUrl && (
          <section className="project-article-explore" aria-labelledby="project-explore-title">
            <h2 id="project-explore-title">{content.buttons.projectLink}</h2>
            <p><a href={metadata.projectUrl} target="_blank" rel="noopener noreferrer">{isGitHub ? (km ? "មើលនៅលើ GitHub" : "View on GitHub") : (km ? "ចូលមើលគម្រោង" : "Visit the project")} <span aria-hidden="true">↗</span><span className="sr-only">{km ? " (បើកក្នុងផ្ទាំងថ្មី)" : " (opens in a new tab)"}</span></a></p>
          </section>
        )}
      </div>
    </article>
  );
}
