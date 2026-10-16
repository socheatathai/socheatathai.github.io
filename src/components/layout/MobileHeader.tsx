"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "@/components/layout/PageLink";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageToggle, NavigationLinks, SidebarProfile } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { language, content } = useLanguage();
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    if (!mobile.matches) { setOpen(false); return; }

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

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
  }

  return <header className="mobile-header">
    <div className="mobile-header-bar">
      <Link className="mobile-brand" href="/" direction="back" onClick={() => setOpen(false)}><span>{content.logo}</span></Link>
      <div className="mobile-header-actions">
        <button className="menu-toggle" type="button" aria-controls="mobile-navigation" aria-haspopup="dialog" aria-expanded={open} aria-label={language === "km" ? "បើកម៉ឺនុយ" : "Open navigation"} onClick={() => setOpen(true)}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
    </div>
    <dialog id="mobile-navigation" className="mobile-drawer" ref={drawerRef} aria-labelledby="mobile-navigation-title" onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClose={() => setOpen(false)} onClick={onBackdropClick}>
      <div className="mobile-drawer-content">
        <div className="mobile-drawer-heading">
          <h2 id="mobile-navigation-title">{language === "km" ? "ម៉ឺនុយ" : "Menu"}</h2>
          <button className="menu-toggle" type="button" aria-label={language === "km" ? "បិទម៉ឺនុយ" : "Close navigation"} onClick={() => setOpen(false)} autoFocus>
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
        <SidebarProfile onNavigate={() => setOpen(false)} />
        <nav className="mobile-drawer-nav" aria-label={language === "km" ? "ការរុករកចម្បង" : "Main navigation"}><NavigationLinks onNavigate={() => setOpen(false)} /></nav>
        <div className="mobile-drawer-bottom">
          <div className="sidebar-preferences"><LanguageToggle /><ThemeToggle /></div>
        </div>
      </div>
    </dialog>
  </header>;
}
