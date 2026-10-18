"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { BlogSearchProps } from "./types";
import styles from "./BlogSearch.module.css";
import { MAX_BLOG_QUERY_LENGTH } from "@/lib/blog-query";

export default function BlogSearch({
  query,
  onQueryChange,
  inputRef,
  onKeyDown,
  clearSearch,
  shortcut,
}: BlogSearchProps) {
  const { content } = useLanguage();

  return (
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
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
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
          maxLength={MAX_BLOG_QUERY_LENGTH}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={content.blog.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
          aria-controls="blog-search-results"
          aria-describedby="blog-search-summary"
          aria-keyshortcuts="Meta+K Control+K"
        />
        {query.length > 0 ? (
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
        ) : (
          <kbd className={styles.shortcut} aria-hidden="true">
            {shortcut}
          </kbd>
        )}
      </div>
    </form>
  );
}
