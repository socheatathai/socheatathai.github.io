"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBlogDate, localizedBlogText } from "@/lib/blog-text";
import type { BlogPostMetadata } from "@/types/blog";

export function BlogEntry({ post }: { post: BlogPostMetadata }) {
  const { language, content } = useLanguage();
  const km = language === "km";
  const text = localizedBlogText(post, language);
  const isProject = post.type === "project";

  return (
    <article className="blog-entry" lang={km && post.km ? "km" : "en"}>
      <div className="blog-meta">
        <span>{isProject ? content.blog.projectType : content.blog.articleType}</span>
        {post.date && (
          <>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatBlogDate(post.date, language)}</time>
          </>
        )}
      </div>
      <h2>
        <Link href={`/blog/${post.slug}/`}>{text.title}</Link>
      </h2>
      <p>{text.description}</p>
      <div className="blog-entry-footer">
        <ul
          className="tag-list"
          aria-label={isProject ? content.blog.projectTopics : content.blog.topics}
        >
          {text.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <Link className="text-link" href={`/blog/${post.slug}/`}>
          {isProject ? content.blog.readProject : content.blog.readArticle}{" "}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">: {text.title}</span>
        </Link>
      </div>
    </article>
  );
}

export default function BlogList({ posts }: { posts: BlogPostMetadata[] }) {
  const { content } = useLanguage();
  if (posts.length === 0) {
    return <p>{content.blog.emptyArchive}</p>;
  }

  return (
    <div className="blog-list">
      {posts.map((post) => (
        <BlogEntry key={post.slug} post={post} />
      ))}
    </div>
  );
}
