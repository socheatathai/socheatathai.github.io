export const BLOG_PAGE_SIZE = 6;

export function getBlogPageCount(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / BLOG_PAGE_SIZE));
}

export function getBlogPageHref(page: number): string {
  return page === 1 ? "/blog/" : `/blog/page/${page}/`;
}
