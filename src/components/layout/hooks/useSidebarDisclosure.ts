"use client";

import { useEffect, useRef, useState } from "react";

export function useSidebarDisclosure() {
  const [collapsed, setCollapsed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef(false);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const target = collapsed ? reopenButtonRef.current : closeButtonRef.current;
    target?.focus();
  }, [collapsed]);

  function toggleSidebar() {
    pendingFocus.current = true;
    setCollapsed((value) => !value);
  }

  return { collapsed, closeButtonRef, reopenButtonRef, toggleSidebar };
}
