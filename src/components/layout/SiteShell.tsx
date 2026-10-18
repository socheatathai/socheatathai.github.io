"use client";

import { useLanguage } from "@/components/LanguageProvider";
import Sidebar from "@/components/layout/Sidebar";
import { LayoutIcon } from "./icons";
import { useSidebarDisclosure } from "./hooks/useSidebarDisclosure";
import type { LayoutChildrenProps } from "./types";

const sidebarId = "desktop-sidebar";

export default function SiteShell({ children }: LayoutChildrenProps) {
  const { content } = useLanguage();
  const { collapsed, closeButtonRef, reopenButtonRef, toggleSidebar } = useSidebarDisclosure();

  return (
    <div className={`site-shell${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <Sidebar
        id={sidebarId}
        collapsed={collapsed}
        onClose={toggleSidebar}
        closeButtonRef={closeButtonRef}
      />
      {collapsed && (
        <button
          ref={reopenButtonRef}
          className="sidebar-toggle sidebar-reopen"
          type="button"
          aria-controls={sidebarId}
          aria-expanded={false}
          aria-label={content.sidebar.open}
          onClick={toggleSidebar}
        >
          <LayoutIcon name="menu" size={21} strokeWidth={1.7} />
        </button>
      )}
      <div className="main-column">{children}</div>
    </div>
  );
}
