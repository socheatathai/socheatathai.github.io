"use client";

import Image from "next/image";
import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBlogDate, localizedBlogText } from "@/lib/blog-text";
import type { BlogArticleProps } from "./types";

/** MDX is compiled on the server; only its rendered language is selected here. */
export default function BlogArticle({
  metadata,
  children,
  khmerContent,
  backHref = "/blog/",
}: BlogArticleProps) {
  const { language, content } = useLanguage();
  const km = language === "km";
  const translated = km && Boolean(metadata.km && khmerContent);
  const text = localizedBlogText(metadata, language);
  const isProject = metadata.type === "project";
  const isGitHub = metadata.projectUrl
    ? new URL(metadata.projectUrl).hostname === "github.com"
    : false;

  return (
    <article
      className={`blog-detail${isProject ? " project-article" : ""}`}
      lang={translated ? "km" : "en"}
    >
      <Link className="text-link back-link" href={backHref} direction="back">
        ← {content.blog.allPosts}
      </Link>
      <header className="page-header">
        <div className="blog-meta">
          {isProject && (
            <>
              <span>{content.blog.projectType}</span>
              <span aria-hidden="true">·</span>
              <span>
                {content.blog.by} {content.logo}
              </span>
            </>
          )}
          {isProject && metadata.date && <span aria-hidden="true">·</span>}
          {metadata.date && (
            <time dateTime={metadata.date}>{formatBlogDate(metadata.date, language)}</time>
          )}
        </div>
        <h1>{text.title}</h1>
        <p className="lead">{text.description}</p>
        <ul
          className="tag-list"
          aria-label={isProject ? content.blog.projectTopics : content.blog.topics}
        >
          {text.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </header>
      {metadata.image && (
        <figure className="blog-article-figure">
          {metadata.image.startsWith("/images/") ? (
            <Image
              src={metadata.image}
              alt={text.title}
              width={metadata.imageWidth}
              height={metadata.imageHeight}
              priority
              sizes="(max-width: 767px) 100vw, 780px"
            />
          ) : (
            <img src={metadata.image} alt={text.title} decoding="async" fetchPriority="high" />
          )}
          {isProject && <figcaption>{content.blog.coverCaption}</figcaption>}
        </figure>
      )}
      <div className="prose blog-detail-body">
        {translated ? khmerContent : children}
        {isProject && metadata.projectUrl && (
          <section className="project-article-explore" aria-labelledby="project-explore-title">
            <h2 id="project-explore-title">{content.buttons.projectLink}</h2>
            <p>
              <a href={metadata.projectUrl} target="_blank" rel="noopener noreferrer">
                {isGitHub ? content.blog.viewGitHub : content.blog.visitProject}{" "}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">{` (${content.common.opensInNewTab})`}</span>
              </a>
            </p>
          </section>
        )}
      </div>
    </article>
  );
}
