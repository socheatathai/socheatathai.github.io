"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  blogQueryHref,
  hasBlogCriteria,
  MAX_BLOG_QUERY_LENGTH,
  type BlogQuery,
} from "@/lib/blog-query";
import type { BlogSort } from "@/types/blog";
import type { Language } from "@/types/language";

/** Controls update URL criteria; the server returns only the requested result page. */
export function useBlogSearch(criteria: BlogQuery, language: Language) {
  const router = useRouter();
  const [query, setQuery] = useState(criteria.query);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const draft = useRef(query);
  const submitted = useRef(criteria.query);
  const previousLanguage = useRef(language);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ criteria, language });
  latest.current = { criteria, language };

  function navigate(patch: Partial<BlogQuery>, replace = false) {
    clearTimeout(timer.current);
    const next = {
      ...latest.current.criteria,
      query: draft.current.normalize("NFKC").trim().slice(0, MAX_BLOG_QUERY_LENGTH),
      language: latest.current.language,
      page: 1,
      ...patch,
    };
    submitted.current = next.query;
    startTransition(() => {
      if (replace) router.replace(blogQueryHref(next), { scroll: false });
      else router.push(blogQueryHref(next), { scroll: false });
    });
  }

  useEffect(() => {
    if (criteria.query !== submitted.current || draft.current === submitted.current) {
      draft.current = criteria.query;
      setQuery(criteria.query);
    }
    submitted.current = criteria.query;
  }, [criteria.query]);

  useEffect(() => {
    draft.current = query;
    if (query.normalize("NFKC").trim().slice(0, MAX_BLOG_QUERY_LENGTH) === criteria.query) return;
    timer.current = setTimeout(() => navigate({}, true), 300);
    return () => clearTimeout(timer.current);
    // Navigation reads the latest criteria rather than capturing stale filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, criteria.query]);

  useEffect(() => {
    const urlLanguage =
      new URLSearchParams(window.location.search).get("lang") === "km" ? "km" : "en";
    if (
      previousLanguage.current !== language &&
      criteria.language !== language &&
      urlLanguage !== language
    ) {
      navigate({ language }, true);
    }
    previousLanguage.current = language;
  }, [language, criteria.language]);

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
    function focusSearch(event: globalThis.KeyboardEvent) {
      if (
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        (!event.ctrlKey && !event.metaKey) ||
        event.key.toLowerCase() !== "k"
      )
        return;
      const input = inputRef.current;
      if (!input) return;
      const dialog = document.querySelector("dialog[open]");
      if (dialog && !dialog.contains(input)) return;
      if (
        event.target !== input &&
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        )
      )
        return;
      event.preventDefault();
      input.focus();
    }
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  function clearSearch() {
    draft.current = "";
    setQuery("");
    navigate({ query: "" }, true);
    inputRef.current?.focus();
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent?.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      navigate({}, true);
    }
  }
  function resetFilters() {
    draft.current = "";
    setQuery("");
    navigate({ query: "", tag: null, sort: "latest" });
    inputRef.current?.focus();
  }
  return {
    query,
    setQuery: (value: string) => {
      draft.current = value;
      setQuery(value);
    },
    inputRef,
    shortcut,
    pending,
    clearSearch,
    handleKeyDown,
    resetFilters,
    tag: criteria.tag,
    setTag: (tag: string | null) => navigate({ tag }),
    sort: criteria.sort,
    setSort: (sort: BlogSort) => navigate({ sort }),
    active: hasBlogCriteria(criteria),
  };
}
