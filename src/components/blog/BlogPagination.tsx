"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { BLOG_PAGE_SIZE, getBlogPageHref } from "@/lib/blog-pagination";

type Props = {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
};

/** Keep the current page and its neighbors visible as the archive grows. */
function paginationPages(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const visible = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const pages: (number | "ellipsis")[] = [];
  for (const page of visible) {
    const previous = pages.at(-1);
    if (typeof previous === "number" && page - previous === 2) pages.push(previous + 1);
    else if (typeof previous === "number" && page - previous > 2) pages.push("ellipsis");
    pages.push(page);
  }
  return pages;
}

export default function BlogPagination({ currentPage, totalPages, totalPosts }: Props) {
  const { language } = useLanguage();
  if (totalPages <= 1) return null;

  const km = language === "km";
  const formatNumber = new Intl.NumberFormat(km ? "km-KH" : "en", { numberingSystem: km ? "khmr" : "latn" }).format;
  const firstPost = (currentPage - 1) * BLOG_PAGE_SIZE + 1;
  const lastPost = Math.min(currentPage * BLOG_PAGE_SIZE, totalPosts);
  const previousLabel = km ? "ទំព័រមុន" : "Previous";
  const nextLabel = km ? "ទំព័របន្ទាប់" : "Next";

  return (
    <nav className="blog-pagination" aria-label={km ? "ការប្ដូរទំព័រប្លុក" : "Blog pagination"}>
      <p className="blog-pagination-summary">
        {km
          ? `បង្ហាញអត្ថបទ ${formatNumber(firstPost)}–${formatNumber(lastPost)} ក្នុងចំណោម ${formatNumber(totalPosts)}`
          : `Showing ${formatNumber(firstPost)}–${formatNumber(lastPost)} of ${formatNumber(totalPosts)} posts`}
      </p>
      <div className="blog-pagination-controls">
        {currentPage > 1 ? (
          <Link className="blog-pagination-control" href={getBlogPageHref(currentPage - 1)} direction="back" scroll aria-label={previousLabel}>
            <span aria-hidden="true">←</span><span className="blog-pagination-control-label">{previousLabel}</span>
          </Link>
        ) : (
          <span className="blog-pagination-control is-disabled" aria-disabled="true">
            <span aria-hidden="true">←</span><span className="blog-pagination-control-label">{previousLabel}</span>
          </span>
        )}
        <ol className="blog-pagination-pages">
          {paginationPages(currentPage, totalPages).map((page, index) => (
            <li key={typeof page === "number" ? page : `ellipsis-${index}`}>
              {page === "ellipsis" ? (
                <span className="blog-pagination-ellipsis" aria-hidden="true">…</span>
              ) : page === currentPage ? (
                <span className="blog-pagination-page is-current" aria-current="page" aria-label={`${km ? "ទំព័រ" : "Page"} ${formatNumber(page)}`}>{formatNumber(page)}</span>
              ) : (
                <Link className="blog-pagination-page" href={getBlogPageHref(page)} direction={page < currentPage ? "back" : "forward"} scroll aria-label={`${km ? "ទំព័រ" : "Page"} ${formatNumber(page)}`}>{formatNumber(page)}</Link>
              )}
            </li>
          ))}
        </ol>
        {currentPage < totalPages ? (
          <Link className="blog-pagination-control" href={getBlogPageHref(currentPage + 1)} scroll aria-label={nextLabel}>
            <span className="blog-pagination-control-label">{nextLabel}</span><span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className="blog-pagination-control is-disabled" aria-disabled="true">
            <span className="blog-pagination-control-label">{nextLabel}</span><span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </nav>
  );
}
