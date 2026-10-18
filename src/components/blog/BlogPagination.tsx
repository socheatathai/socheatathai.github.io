"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { BLOG_PAGE_SIZE, getBlogPageHref } from "@/lib/blog-pagination";
import { getBlogPaginationItems } from "@/lib/blog-pagination-items";
import { formatLocalizedNumber } from "@/lib/locale";
import type { BlogPaginationProps } from "./types";
import { blogQueryHref } from "@/lib/blog-query";

export default function BlogPagination({
  currentPage,
  totalPages,
  totalPosts,
  criteria,
}: BlogPaginationProps) {
  const { language, content } = useLanguage();
  if (totalPages <= 1) return null;

  const formatNumber = (value: number) => formatLocalizedNumber(value, language);
  const href = (page: number) => (criteria ? blogQueryHref(criteria, page) : getBlogPageHref(page));
  const firstPost = (currentPage - 1) * BLOG_PAGE_SIZE + 1;
  const lastPost = Math.min(currentPage * BLOG_PAGE_SIZE, totalPosts);
  const previousLabel = content.blog.previous;
  const nextLabel = content.blog.next;
  const summary = content.blog.paginationSummary
    .replace("{first}", formatNumber(firstPost))
    .replace("{last}", formatNumber(lastPost))
    .replace("{total}", formatNumber(totalPosts));

  return (
    <nav className="blog-pagination" aria-label={content.blog.paginationLabel}>
      <p className="blog-pagination-summary">{summary}</p>
      <div className="blog-pagination-controls">
        {currentPage > 1 ? (
          <Link
            className="blog-pagination-control"
            href={href(currentPage - 1)}
            direction="back"
            scroll
            aria-label={previousLabel}
          >
            <span aria-hidden="true">←</span>
            <span className="blog-pagination-control-label">{previousLabel}</span>
          </Link>
        ) : (
          <span className="blog-pagination-control is-disabled" aria-disabled="true">
            <span aria-hidden="true">←</span>
            <span className="blog-pagination-control-label">{previousLabel}</span>
          </span>
        )}
        <ol className="blog-pagination-pages">
          {getBlogPaginationItems(currentPage, totalPages).map((page, index) => (
            <li key={typeof page === "number" ? page : `ellipsis-${index}`}>
              {page === "ellipsis" ? (
                <span className="blog-pagination-ellipsis" aria-hidden="true">
                  …
                </span>
              ) : page === currentPage ? (
                <span
                  className="blog-pagination-page is-current"
                  aria-current="page"
                  aria-label={`${content.blog.page} ${formatNumber(page)}`}
                >
                  {formatNumber(page)}
                </span>
              ) : (
                <Link
                  className="blog-pagination-page"
                  href={href(page)}
                  direction={page < currentPage ? "back" : "forward"}
                  scroll
                  aria-label={`${content.blog.page} ${formatNumber(page)}`}
                >
                  {formatNumber(page)}
                </Link>
              )}
            </li>
          ))}
        </ol>
        {currentPage < totalPages ? (
          <Link
            className="blog-pagination-control"
            href={href(currentPage + 1)}
            scroll
            aria-label={nextLabel}
          >
            <span className="blog-pagination-control-label">{nextLabel}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className="blog-pagination-control is-disabled" aria-disabled="true">
            <span className="blog-pagination-control-label">{nextLabel}</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </nav>
  );
}
