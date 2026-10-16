"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import type { BlogPostMetadata } from "@/lib/blog";
import { localizedBlogText } from "./blogText";
import styles from "./RelatedPosts.module.css";

export default function RelatedPosts({ posts }: { posts: BlogPostMetadata[] }) {
  const { language } = useLanguage();
  const km = language === "km";
  if (posts.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="related-posts-title">
      <div className={styles.heading}>
        <h2 id="related-posts-title">{km ? "អានបន្ត" : "Keep exploring"}</h2>
        <Link className="text-link" href="/blog/">{km ? "អត្ថបទទាំងអស់" : "All posts"} <span aria-hidden="true">→</span></Link>
      </div>
      <ul className={styles.grid}>
        {posts.map((post) => {
          const text = localizedBlogText(post, language);
          const isProject = post.type === "project";
          return (
            <li key={post.slug}>
              <Link className={styles.card} href={`/blog/${post.slug}/`}>
                <div className={styles.copy}>
                  <span className={styles.type}>{isProject ? (km ? "កំណត់ត្រាគម្រោង" : "Project notes") : (km ? "អត្ថបទ" : "Article")}</span>
                  <div lang={km && post.km ? "km" : "en"}>
                    <h3>{text.title}</h3>
                    <p>{text.description}</p>
                  </div>
                  <span className={styles.action}>{isProject ? (km ? "អានកំណត់ត្រា" : "Read notes") : (km ? "អានអត្ថបទ" : "Read article")} <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
