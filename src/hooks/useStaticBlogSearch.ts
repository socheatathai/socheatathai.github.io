"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  blogQueryHref,
  hasBlogCriteria,
  MAX_BLOG_QUERY_LENGTH,
  parseBlogQuery,
  type BlogQuery,
} from "@/lib/blog-query";
import { createStaticBlogSearch } from "@/lib/blog-static-search";
import type { BlogPageData, BlogSort } from "@/types/blog";
import type { Language } from "@/types/language";

function urlCriteria(language: Language) {
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  if (params.lang !== "km" && params.lang !== "en") params.lang = language;
  const route = /^\/blog\/page\/([1-9]\d{0,6})\/?$/.exec(window.location.pathname);
  return parseBlogQuery(params, route ? Number(route[1]) : undefined);
}
function samePage(a: BlogQuery, b: BlogQuery) {
  return a.query === b.query && a.tag === b.tag && a.sort === b.sort && a.page === b.page;
}
const normalizedQuery = (query: string) =>
  query.normalize("NFKC").trim().slice(0, MAX_BLOG_QUERY_LENGTH);

type InitialPage = BlogPageData & { criteria: BlogQuery; manifestUrl: string };

/** Native history keeps static archive searches independent of Next's RSC transport. */
export function useStaticBlogSearch(initial: InitialPage, language: Language) {
  const baseline = useRef(initial);
  const engine = useRef<ReturnType<typeof createStaticBlogSearch> | null>(null);
  if (!engine.current) engine.current = createStaticBlogSearch(initial.manifestUrl);
  const [criteria, setCriteria] = useState(initial.criteria);
  const [query, setQuery] = useState(initial.criteria.query);
  const [result, setResult] = useState<BlogPageData>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const [composing, setComposing] = useState(false);
  const [retry, setRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const focusResults = useRef(false);
  const draft = useRef(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousLanguage = useRef(language);
  const latest = useRef({ criteria, language });
  latest.current = { criteria, language };

  function navigate(patch: Partial<BlogQuery>, replace = false) {
    clearTimeout(timer.current);
    const next: BlogQuery = {
      ...latest.current.criteria,
      query: normalizedQuery(draft.current),
      language: latest.current.language,
      page: 1,
      ...patch,
    };
    const href = blogQueryHref(next);
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
    draft.current = next.query;
    setQuery(next.query);
    setCriteria(next);
  }

  useEffect(() => {
    function syncUrl() {
      clearTimeout(timer.current);
      const next = urlCriteria(latest.current.language);
      draft.current = next.query;
      setQuery(next.query);
      setCriteria(next);
    }
    syncUrl();
    window.addEventListener("popstate", syncUrl);
    return () => {
      window.removeEventListener("popstate", syncUrl);
      clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    draft.current = query;
    if (composing || normalizedQuery(query) === criteria.query) return;
    timer.current = setTimeout(() => navigate({}, true), 300);
    return () => clearTimeout(timer.current);
    // All navigation uses the latest criteria and draft via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, criteria.query, composing]);

  useEffect(() => {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");
    if (
      previousLanguage.current !== language &&
      criteria.language !== language &&
      urlLanguage !== language
    )
      navigate({ language }, true);
    previousLanguage.current = language;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, criteria.language]);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    if (samePage(criteria, baseline.current.criteria)) {
      setResult(baseline.current);
      setPending(false);
      if (focusResults.current) {
        resultsRef.current?.focus();
        focusResults.current = false;
      }
      return () => controller.abort();
    }
    setPending(true);
    engine.current!.search(criteria, controller.signal).then(
      (page) => {
        if (controller.signal.aborted) return;
        setResult(page);
        setPending(false);
        if (criteria.page !== page.currentPage) {
          const corrected = { ...criteria, page: page.currentPage };
          window.history.replaceState(null, "", blogQueryHref(corrected));
          setCriteria(corrected);
        }
        if (focusResults.current) {
          resultsRef.current?.focus();
          focusResults.current = false;
        }
      },
      () => {
        if (controller.signal.aborted) return;
        setPending(false);
        setError(true);
      },
    );
    return () => controller.abort();
  }, [criteria, retry]);

  useEffect(() => {
    if (!hasBlogCriteria(criteria)) return;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const oldContent = meta?.getAttribute("content") ?? null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.append(meta);
    }
    meta.content = "noindex, follow";
    return () => {
      if (created) meta.remove();
      else if (oldContent !== null) meta.setAttribute("content", oldContent);
      else meta.removeAttribute("content");
    };
  }, [criteria]);

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
    if (event.nativeEvent?.isComposing || composing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    } else if (event.key === "Enter") {
      event.preventDefault();
      navigate({}, true);
    }
  }
  function handlePaginationClick(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>(".blog-pagination a[href]")
        : null;
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self"))
      return;
    const url = new URL(anchor.href, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !/^\/blog\/(?:page\/[1-9]\d{0,6}\/)?$/.test(url.pathname)
    )
      return;
    event.preventDefault();
    const route = /^\/blog\/page\/([1-9]\d{0,6})\/$/.exec(url.pathname);
    const next = parseBlogQuery(Object.fromEntries(url.searchParams), route ? Number(route[1]) : 1);
    focusResults.current = true;
    navigate(next);
  }
  return {
    criteria,
    query,
    setQuery: (value: string) => {
      draft.current = value;
      setQuery(value);
    },
    inputRef,
    resultsRef,
    shortcut,
    pending,
    error,
    result,
    retry: () => setRetry((value) => value + 1),
    clearSearch,
    handleKeyDown,
    handlePaginationClick,
    handleCompositionStart: () => {
      clearTimeout(timer.current);
      setComposing(true);
    },
    handleCompositionEnd: () => setComposing(false),
    tag: criteria.tag,
    setTag: (tag: string | null) => navigate({ tag }),
    sort: criteria.sort,
    setSort: (sort: BlogSort) => navigate({ sort }),
    active: hasBlogCriteria(criteria),
    resetFilters: () => {
      draft.current = "";
      setQuery("");
      navigate({ query: "", tag: null, sort: "latest" });
      inputRef.current?.focus();
    },
  };
}
