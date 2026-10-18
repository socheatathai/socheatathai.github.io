"use client";

import { ViewTransition, useSyncExternalStore } from "react";
import type { LayoutChildrenProps } from "./types";

const mobileMotionQuery = "(max-width: 767px) and (prefers-reduced-motion: no-preference)";
const enter = {
  "page-forward": "page-enter-forward",
  "page-back": "page-enter-back",
  default: "none",
};
const exit = {
  "page-forward": "page-exit-forward",
  "page-back": "page-exit-back",
  default: "none",
};

function subscribe(onChange: () => void) {
  const media = window.matchMedia(mobileMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(mobileMotionQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export default function PageTransition({ children }: LayoutChildrenProps) {
  const animate = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <ViewTransition default="none" enter={animate ? enter : "none"} exit={animate ? exit : "none"}>
      <div className="page-transition">{children}</div>
    </ViewTransition>
  );
}
