"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { BLOG_SORT_OPTIONS } from "@/lib/blog-filters";
import type { BlogSort } from "@/types/blog";
import type { BlogFiltersProps } from "./types";
import styles from "./BlogSearch.module.css";

export default function BlogFilters({
  tags,
  tag,
  onTagChange,
  sort,
  onSortChange,
}: BlogFiltersProps) {
  const { content } = useLanguage();

  return (
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label={content.blog.filterLabel}>
        <button
          className={styles.filter}
          type="button"
          aria-pressed={tag === null}
          aria-controls="blog-search-results"
          onClick={() => onTagChange(null)}
        >
          {content.blog.allTags}
        </button>
        {tags.map((value) => (
          <button
            key={value}
            className={styles.filter}
            type="button"
            aria-pressed={
              tag?.normalize("NFKC").trim().toLowerCase() ===
              value.normalize("NFKC").trim().toLowerCase()
            }
            aria-controls="blog-search-results"
            onClick={() => onTagChange(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className={styles.sort}>
        <label htmlFor="blog-sort">{content.blog.sortLabel}</label>
        <div className={styles.selectWrap}>
          <select
            id="blog-sort"
            name="sort"
            value={sort}
            onChange={(event) => onSortChange(event.currentTarget.value as BlogSort)}
            aria-controls="blog-search-results"
          >
            {BLOG_SORT_OPTIONS.map((value) => (
              <option value={value} key={value}>
                {content.blog.sortOptions[value]}
              </option>
            ))}
          </select>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
