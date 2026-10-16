"use client";

import { useEffect, useState, type FocusEvent } from "react";

export function useArticlePromo(slideCount: number) {
  const [dismissed, setDismissed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const rotating = desktop && !dismissed && !paused && !hovered && !focused && !reducedMotion;

  useEffect(() => {
    const viewport = window.matchMedia("(min-width: 1280px)");
    setDesktop(viewport.matches);
    function updateViewport(event: MediaQueryListEvent) {
      setDesktop(event.matches);
      if (!event.matches) {
        setHovered(false);
        setFocused(false);
      }
    }
    viewport.addEventListener("change", updateViewport);
    return () => viewport.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(preference.matches);
    function updatePreference(event: MediaQueryListEvent) {
      setReducedMotion(event.matches);
    }
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timeout = window.setTimeout(
      () => setActiveSlide((value) => (value + 1) % slideCount),
      6000,
    );
    return () => window.clearTimeout(timeout);
  }, [activeSlide, rotating, slideCount]);

  function onBlurCapture(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }

  function dismiss() {
    setDismissed(true);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }

  return {
    dismissed,
    activeSlide,
    paused,
    reducedMotion,
    rotating,
    selectSlide: setActiveSlide,
    togglePaused: () => setPaused((value) => !value),
    dismiss,
    interactionProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture,
    },
  };
}
