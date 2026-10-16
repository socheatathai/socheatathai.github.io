"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { BlogPostMetadata } from "@/lib/blog";
import { searchBlogPosts } from "@/lib/blog-search";
import BlogList from "./BlogList";
import BlogPagination from "./BlogPagination";
import styles from "./BlogSearch.module.css";

type Props = {
  posts: BlogPostMetadata[];
  allPosts: BlogPostMetadata[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
};

export default function BlogContent({ posts, allPosts, currentPage, totalPages, totalPosts }: Props) {
  const { language } = useLanguage();
  const km = language === "km";
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = query.trim().length > 0;
  const results = useMemo(() => searchBlogPosts(allPosts, query), [allPosts, query]);
  const formatNumber = new Intl.NumberFormat(km ? "km-KH" : "en", { numberingSystem: km ? "khmr" : "latn" }).format;

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="blog-index">
      <header className={styles.header}>
        <p className="eyebrow">{km ? "កំណត់ត្រា និងគំនិត" : "Notes & ideas"}</p>
        <div className={styles.headingRow}>
          <h1>{km ? "ប្លុក" : "Blog"}</h1>
          <form className={styles.search} role="search" aria-label={km ? "ស្វែងរកក្នុងប្លុក" : "Blog search"} onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="blog-search">{km ? "ស្វែងរកអត្ថបទ និងគម្រោង" : "Search articles and projects"}</label>
            <div className={styles.field}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input ref={inputRef} id="blog-search" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); clearSearch(); } }} placeholder={km ? "ស្វែងរក…" : "Search posts…"} autoComplete="off" spellCheck={false} aria-controls="blog-search-results" aria-describedby="blog-search-summary" />
              {query.length > 0 && <button className={styles.clear} type="button" onClick={clearSearch} aria-label={km ? "សម្អាតការស្វែងរក" : "Clear search"}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>}
            </div>
          </form>
        </div>
        <p className={`lead ${styles.description}`}>{km ? "កំណត់ត្រាគម្រោង ឧទាហរណ៍អភិវឌ្ឍ និងគំនិតសម្រាប់អនុវត្ត។" : "Project notes, development examples, and practical ideas."}</p>
        <p id="blog-search-summary" className={styles.summary} role="status" aria-atomic="true">
          {searching
            ? (km ? `រកឃើញ ${formatNumber(results.length)} លទ្ធផល` : `${formatNumber(results.length)} ${results.length === 1 ? "result" : "results"}`)
            : (km ? `ស្វែងរកក្នុងអត្ថបទ និងគម្រោងទាំង ${formatNumber(allPosts.length)}` : `Search across all ${formatNumber(allPosts.length)} articles and projects.`)}
        </p>
      </header>
      <div id="blog-search-results">
        {searching && results.length === 0 ? (
          <div className="empty-state"><p>{km ? "រកមិនឃើញអត្ថបទ ឬគម្រោងទេ។" : "No articles or projects found."}</p><p>{km ? "សាកល្បងចំណងជើង ប្រធានបទ ឬបច្ចេកវិទ្យាផ្សេងទៀត។" : "Try another title, topic, or technology."}</p></div>
        ) : <BlogList posts={searching ? results : posts} />}
      </div>
      {!searching && <BlogPagination currentPage={currentPage} totalPages={totalPages} totalPosts={totalPosts} />}
    </div>
  );
}
