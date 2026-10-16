"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { searchBlogPosts } from "@/lib/blog-search";
import type { BlogPostMetadata } from "@/types/blog";

export function useBlogSearch(posts: BlogPostMetadata[]) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = query.trim().length > 0;
  const results = useMemo(() => searchBlogPosts(posts, query), [posts, query]);

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
  }

  return { query, setQuery, inputRef, searching, results, clearSearch, handleKeyDown };
}
