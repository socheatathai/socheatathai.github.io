"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useBlogSearch } from "@/hooks/useBlogSearch";
import { formatLocalizedNumber } from "@/lib/locale";
import BlogList from "./BlogList";
import BlogPagination from "./BlogPagination";
import type { BlogContentProps } from "./types";
import styles from "./BlogSearch.module.css";

export default function BlogContent({
  posts,
  allPosts,
  currentPage,
  totalPages,
  totalPosts,
}: BlogContentProps) {
  const { language, content } = useLanguage();
  const { query, setQuery, inputRef, searching, results, clearSearch, handleKeyDown } =
    useBlogSearch(allPosts);
  const summary = searching
    ? (results.length === 1 ? content.blog.result : content.blog.results).replace(
        "{count}",
        formatLocalizedNumber(results.length, language),
      )
    : content.blog.searchSummary.replace(
        "{count}",
        formatLocalizedNumber(allPosts.length, language),
      );

  return (
    <div className="blog-index">
      <header className={styles.header}>
        <p className="eyebrow">{content.blog.eyebrow}</p>
        <div className={styles.headingRow}>
          <h1>{content.nav.blog}</h1>
          <form
            className={styles.search}
            role="search"
            aria-label={content.blog.searchLabel}
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="sr-only" htmlFor="blog-search">
              {content.blog.searchInputLabel}
            </label>
            <div className={styles.field}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                ref={inputRef}
                id="blog-search"
                name="q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={content.blog.searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                aria-controls="blog-search-results"
                aria-describedby="blog-search-summary"
              />
              {query.length > 0 && (
                <button
                  className={styles.clear}
                  type="button"
                  onClick={clearSearch}
                  aria-label={content.blog.clearSearch}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
        <p className={`lead ${styles.description}`}>{content.blog.description}</p>
        <p id="blog-search-summary" className={styles.summary} role="status" aria-atomic="true">
          {summary}
        </p>
      </header>
      <div id="blog-search-results">
        {searching && results.length === 0 ? (
          <div className="empty-state">
            <p>{content.blog.noResults}</p>
            <p>{content.blog.searchHint}</p>
          </div>
        ) : (
          <BlogList posts={searching ? results : posts} />
        )}
      </div>
      {!searching && (
        <BlogPagination currentPage={currentPage} totalPages={totalPages} totalPosts={totalPosts} />
      )}
    </div>
  );
}
