"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";

export function useMobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    if (!mobile.matches) {
      setOpen(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    drawer.showModal();
    document.body.style.overflow = "hidden";

    function onResize(event: MediaQueryListEvent) {
      if (!event.matches) setOpen(false);
    }

    mobile.addEventListener("change", onResize);
    return () => {
      drawer.close();
      document.body.style.overflow = previousOverflow;
      mobile.removeEventListener("change", onResize);
    };
  }, [open]);

  function closeNavigation() {
    setOpen(false);
  }

  function openNavigation() {
    setOpen(true);
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      closeNavigation();
  }

  return { open, drawerRef, openNavigation, closeNavigation, onBackdropClick };
}
