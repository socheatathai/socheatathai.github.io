"use client";

import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "./LanguageToggle";
import NavigationLinks from "./NavigationLinks";
import SidebarProfile from "./SidebarProfile";
import SidebarSocials from "./SidebarSocials";
import ThemeToggle from "./ThemeToggle";
import { LayoutIcon } from "./icons";
import type { SidebarProps } from "./types";

export default function Sidebar({ id, collapsed, onClose, closeButtonRef }: SidebarProps) {
  const { content } = useLanguage();
  return (
    <aside
      id={id}
      className="sidebar"
      inert={collapsed}
      aria-hidden={collapsed || undefined}
      aria-label={content.sidebar.label}
    >
      <button
        ref={closeButtonRef}
        className="sidebar-toggle sidebar-close"
        type="button"
        aria-controls={id}
        aria-expanded={!collapsed}
        aria-label={content.sidebar.close}
        onClick={onClose}
      >
        <LayoutIcon name="close" size={21} strokeWidth={1.7} />
      </button>
      <SidebarProfile />
      <nav className="sidebar-nav" aria-label={content.common.primaryNavigation}>
        <NavigationLinks />
      </nav>
      <div className="sidebar-bottom">
        <SidebarSocials />
        <div className="sidebar-preferences">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <p className="sidebar-note">{content.sidebar.note}</p>
      </div>
    </aside>
  );
}
