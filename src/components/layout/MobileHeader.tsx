"use client";

import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "./LanguageToggle";
import NavigationLinks from "./NavigationLinks";
import SidebarProfile from "./SidebarProfile";
import ThemeToggle from "./ThemeToggle";
import { LayoutIcon } from "./icons";
import { useMobileNavigation } from "./hooks/useMobileNavigation";

export default function MobileHeader() {
  const { content } = useLanguage();
  const { open, drawerRef, openNavigation, closeNavigation, onBackdropClick } =
    useMobileNavigation();

  return (
    <header className="mobile-header">
      <div className="mobile-header-bar">
        <Link className="mobile-brand" href="/" direction="back" onClick={closeNavigation}>
          <span>{content.logo}</span>
        </Link>
        <div className="mobile-header-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={content.common.openNavigation}
            onClick={openNavigation}
          >
            <LayoutIcon name="menu" size={23} strokeWidth={1.7} />
          </button>
        </div>
      </div>
      <dialog
        id="mobile-navigation"
        className="mobile-drawer"
        ref={drawerRef}
        aria-labelledby="mobile-navigation-title"
        onCancel={(event) => {
          event.preventDefault();
          closeNavigation();
        }}
        onClose={closeNavigation}
        onClick={onBackdropClick}
      >
        <div className="mobile-drawer-content">
          <div className="mobile-drawer-heading">
            <h2 id="mobile-navigation-title">{content.common.menu}</h2>
            <button
              className="menu-toggle"
              type="button"
              aria-label={content.common.closeNavigation}
              onClick={closeNavigation}
              autoFocus
            >
              <LayoutIcon name="close" size={23} strokeWidth={1.7} />
            </button>
          </div>
          <SidebarProfile onNavigate={closeNavigation} />
          <nav className="mobile-drawer-nav" aria-label={content.common.primaryNavigation}>
            <NavigationLinks onNavigate={closeNavigation} />
          </nav>
          <div className="mobile-drawer-bottom">
            <div className="sidebar-preferences">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
