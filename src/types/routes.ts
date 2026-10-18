export type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export type BlogArchivePageProps = {
  params: Promise<{ page: string }>;
  searchParams: Promise<import("@/lib/blog-query").BlogSearchParams>;
};
