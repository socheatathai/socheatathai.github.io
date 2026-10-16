"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { localizedBlogText } from "@/lib/blog-text";
import type { BlogPostMetadata } from "@/types/blog";
import styles from "./RelatedPosts.module.css";

export default function RelatedPosts({ posts }: { posts: BlogPostMetadata[] }) {
  const { language, content } = useLanguage();
  const km = language === "km";
  if (posts.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="related-posts-title">
      <div className={styles.heading}>
        <h2 id="related-posts-title">{content.blog.relatedTitle}</h2>
        <Link className="text-link" href="/blog/">
          {content.blog.allPosts} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className={styles.grid}>
        {posts.map((post) => {
          const text = localizedBlogText(post, language);
          const isProject = post.type === "project";
          return (
            <li key={post.slug}>
              <Link className={styles.card} href={`/blog/${post.slug}/`}>
                <div className={styles.copy}>
                  <span className={styles.type}>
                    {isProject ? content.blog.projectType : content.blog.articleType}
                  </span>
                  <div lang={km && post.km ? "km" : "en"}>
                    <h3>{text.title}</h3>
                    <p>{text.description}</p>
                  </div>
                  <span className={styles.action}>
                    {isProject ? content.blog.readProject : content.blog.readArticle}{" "}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
