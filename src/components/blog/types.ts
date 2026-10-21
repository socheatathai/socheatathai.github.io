import type { KeyboardEventHandler, ReactNode, Ref } from "react";
import type { BlogPageData, BlogPostMetadata, BlogSort } from "@/types/blog";
import type { BlogQuery } from "@/lib/blog-query";

export type BlogContentProps = BlogPageData & {
  criteria: BlogQuery;
  tags: string[];
  archiveTotal: number;
};

export type BlogPaginationProps = Omit<BlogPageData, "posts"> & {
  criteria?: BlogQuery;
  staticNavigation?: boolean;
};

export type BlogArticleProps = {
  metadata: BlogPostMetadata;
  children: ReactNode;
  khmerContent?: ReactNode;
  backHref?: string;
};

export type BlogSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: Ref<HTMLInputElement>;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  clearSearch: () => void;
  shortcut: string;
};

export type BlogFiltersProps = {
  tags: string[];
  tag: string | null;
  onTagChange: (tag: string | null) => void;
  sort: BlogSort;
  onSortChange: (sort: BlogSort) => void;
};
