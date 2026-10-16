/** Keep the current page and its neighbors visible as the archive grows. */
export function getBlogPaginationItems(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
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
