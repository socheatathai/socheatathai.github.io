"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import Sidebar from "@/components/layout/Sidebar";

const sidebarId = "desktop-sidebar";

export default function SiteShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { language } = useLanguage();
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

  return <div className={`site-shell${collapsed ? " is-sidebar-collapsed" : ""}`}>
    <Sidebar id={sidebarId} collapsed={collapsed} onClose={toggleSidebar} closeButtonRef={closeButtonRef} />
    {collapsed && <button ref={reopenButtonRef} className="sidebar-toggle sidebar-reopen" type="button" aria-controls={sidebarId} aria-expanded={false} aria-label={language === "km" ? "បើករបារចំហៀង" : "Open sidebar"} onClick={toggleSidebar}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>}
    <div className="main-column">{children}</div>
  </div>;
}
