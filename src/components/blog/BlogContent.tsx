"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useBlogSearch } from "@/hooks/useBlogSearch";
import { formatLocalizedNumber } from "@/lib/locale";
import BlogList from "./BlogList";
import BlogSearch from "./BlogSearch";
import BlogFilters from "./BlogFilters";
import BlogPagination from "./BlogPagination";
import type { BlogContentProps } from "./types";
import styles from "./BlogSearch.module.css";

export default function BlogContent({
  posts,
  criteria,
  tags,
  archiveTotal,
  currentPage,
  totalPages,
  totalPosts,
}: BlogContentProps) {
  const { language, content } = useLanguage();
  const {
    query,
    setQuery,
    inputRef,
    clearSearch,
    handleKeyDown,
    tag,
    setTag,
    sort,
    setSort,
    active,
    shortcut,
    pending,
    resetFilters,
  } = useBlogSearch(criteria, language);
  const summary = active
    ? (totalPosts === 1 ? content.blog.result : content.blog.results).replace(
        "{count}",
        formatLocalizedNumber(totalPosts, language),
      )
    : content.blog.searchSummary.replace("{count}", formatLocalizedNumber(archiveTotal, language));

  return (
    <div className="blog-index">
      <header className={styles.header}>
        <div className={styles.introRow}>
          <div className={styles.introCopy}>
            <p className={`eyebrow ${styles.eyebrow}`}>{content.blog.eyebrow}</p>
            <h1 className={styles.title}>{content.nav.blog}</h1>
            <p className={`lead ${styles.description}`}>{content.blog.description}</p>
          </div>
          <BlogSearch
            query={query}
            onQueryChange={setQuery}
            inputRef={inputRef}
            onKeyDown={handleKeyDown}
            clearSearch={clearSearch}
            shortcut={shortcut}
          />
        </div>
        <BlogFilters
          tags={tags}
          tag={tag}
          onTagChange={setTag}
          sort={sort}
          onSortChange={setSort}
        />
        <p id="blog-search-summary" className="sr-only" role="status" aria-atomic="true">
          {summary}
        </p>
      </header>
      <div id="blog-search-results" aria-busy={pending}>
        {pending && <p role="status">{content.blog.searching}</p>}
        {active && totalPosts === 0 ? (
          <div className="empty-state">
            <p>{content.blog.noResults}</p>
            <p>{content.blog.searchHint}</p>
            <button className="button" type="button" onClick={resetFilters}>
              {content.blog.clearFilters}
            </button>
          </div>
        ) : (
          <BlogList posts={posts} />
        )}
      </div>
      <BlogPagination
        criteria={criteria}
        currentPage={currentPage}
        totalPages={totalPages}
        totalPosts={totalPosts}
      />
    </div>
  );
}
