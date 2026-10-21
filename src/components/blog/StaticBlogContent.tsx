"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useStaticBlogSearch } from "@/hooks/useStaticBlogSearch";
import { formatLocalizedNumber } from "@/lib/locale";
import BlogList from "./BlogList";
import BlogSearch from "./BlogSearch";
import BlogFilters from "./BlogFilters";
import BlogPagination from "./BlogPagination";
import type { BlogContentProps } from "./types";
import styles from "./BlogSearch.module.css";

export type StaticBlogContentProps = BlogContentProps & { manifestUrl: string };

export default function StaticBlogContent(props: StaticBlogContentProps) {
  const { language, content } = useLanguage();
  const search = useStaticBlogSearch(props, language);
  const { posts, currentPage, totalPages, totalPosts } = search.result;
  const summary = search.active
    ? (totalPosts === 1 ? content.blog.result : content.blog.results).replace(
        "{count}",
        formatLocalizedNumber(totalPosts, language),
      )
    : content.blog.searchSummary.replace(
        "{count}",
        formatLocalizedNumber(props.archiveTotal, language),
      );
  return (
    <div
      className="blog-index"
      onClickCapture={search.handlePaginationClick}
      onCompositionStartCapture={search.handleCompositionStart}
      onCompositionEndCapture={search.handleCompositionEnd}
    >
      <header className={styles.header}>
        <div className={styles.introRow}>
          <div className={styles.introCopy}>
            <p className={`eyebrow ${styles.eyebrow}`}>{content.blog.eyebrow}</p>
            <h1 className={styles.title}>{content.nav.blog}</h1>
            <p className={`lead ${styles.description}`}>{content.blog.description}</p>
          </div>
          <BlogSearch
            query={search.query}
            onQueryChange={search.setQuery}
            inputRef={search.inputRef}
            onKeyDown={search.handleKeyDown}
            clearSearch={search.clearSearch}
            shortcut={search.shortcut}
          />
        </div>
        <BlogFilters
          tags={props.tags}
          tag={search.tag}
          onTagChange={search.setTag}
          sort={search.sort}
          onSortChange={search.setSort}
        />
        <p id="blog-search-summary" className="sr-only" role="status" aria-atomic="true">
          {search.pending ? content.blog.searching : search.error ? "" : summary}
        </p>
      </header>
      <div
        id="blog-search-results"
        ref={search.resultsRef}
        tabIndex={-1}
        aria-busy={search.pending}
      >
        {search.pending && <p role="status">{content.blog.searching}</p>}
        {search.error ? (
          <div className="empty-state" role="alert">
            <p>
              {language === "km"
                ? "មិនអាចផ្ទុកការស្វែងរកបានទេ។ សូមព្យាយាមម្តងទៀត។"
                : "Search could not be loaded. Please try again."}
            </p>
            <button className="button" type="button" onClick={search.retry}>
              {language === "km" ? "ព្យាយាមម្តងទៀត" : "Try again"}
            </button>
          </div>
        ) : search.active && totalPosts === 0 && !search.pending ? (
          <div className="empty-state">
            <p>{content.blog.noResults}</p>
            <p>{content.blog.searchHint}</p>
            <button className="button" type="button" onClick={search.resetFilters}>
              {content.blog.clearFilters}
            </button>
          </div>
        ) : (
          <BlogList posts={posts} />
        )}
      </div>
      {!search.error && (
        <BlogPagination
          staticNavigation
          criteria={search.criteria}
          currentPage={currentPage}
          totalPages={totalPages}
          totalPosts={totalPosts}
        />
      )}
    </div>
  );
}
