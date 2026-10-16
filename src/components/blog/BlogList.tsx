"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import type { BlogPostMetadata } from "@/lib/blog";
import { formatBlogDate, localizedBlogText } from "./blogText";

export function BlogEntry({ post }: { post: BlogPostMetadata }) {
  const { language } = useLanguage();
  const km = language === "km";
  const text = localizedBlogText(post, language);
  const isProject = post.type === "project";

  return (
    <article className="blog-entry" lang={km && post.km ? "km" : "en"}>
      <div className="blog-meta">
        <span>{isProject ? (km ? "កំណត់ត្រាគម្រោង" : "Project notes") : (km ? "អត្ថបទ" : "Article")}</span>
        {post.date && <><span aria-hidden="true">·</span><time dateTime={post.date}>{formatBlogDate(post.date, language)}</time></>}
      </div>
      <h2><Link href={`/blog/${post.slug}/`}>{text.title}</Link></h2>
      <p>{text.description}</p>
      <ul className="tag-list" aria-label={isProject ? (km ? "បច្ចេកវិទ្យា និងប្រធានបទ" : "Technologies and topics") : (km ? "ប្រធានបទ" : "Topics")}>
        {text.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <Link className="text-link" href={`/blog/${post.slug}/`}>
        {isProject ? (km ? "អានកំណត់ត្រា" : "Read notes") : (km ? "អានអត្ថបទ" : "Read article")} <span aria-hidden="true">↗</span>
        <span className="sr-only">: {text.title}</span>
      </Link>
    </article>
  );
}

export default function BlogList({ posts }: { posts: BlogPostMetadata[] }) {
  const { language } = useLanguage();
  if (posts.length === 0) {
    return <p>{language === "km" ? "អត្ថបទថ្មីៗនឹងបង្ហាញនៅទីនេះក្នុងពេលឆាប់ៗ។" : "New articles will appear here soon."}</p>;
  }

  return (
    <div className="blog-list">
      {posts.map((post) => <BlogEntry key={post.slug} post={post} />)}
    </div>
  );
}
