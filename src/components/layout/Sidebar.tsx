"use client";

import Image from "next/image";
import type { Ref } from "react";
import Link from "@/components/layout/PageLink";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";

type IconName = "home" | "blog" | "about" | "contact";

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-8h6v8" /></>,
    blog: <><path d="M5 3h11l3 3v15H5zM15 3v5h4M8 12h8M8 16h6" /></>,
    about: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    contact: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const currentPath = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
  const { language, content } = useLanguage();
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: content.nav.home, icon: "home" },
    { href: "/blog/", label: language === "km" ? "ប្លុក" : "Blog", icon: "blog" },
    { href: "/about/", label: content.nav.about, icon: "about" },
    { href: "/contact/", label: content.contact.title, icon: "contact" },
  ];
  const currentPageIndex = items.findIndex(({ href }) => href === "/" ? currentPath === "/" : currentPath.startsWith(href));

  return <>{items.map(({ href, label, icon }, index) => {
    const exactPage = currentPath === href;
    const active = exactPage || (href !== "/" && currentPath.startsWith(href));
    const returningToSection = active && !exactPage;
    return <Link key={href} href={href} direction={index < currentPageIndex || returningToSection ? "back" : "forward"} className={`nav-link${active ? " is-active" : ""}`} aria-current={active ? (exactPage ? "page" : "location") : undefined} onClick={onNavigate}>
      <NavIcon name={icon} /><span>{label}</span>
    </Link>;
  })}</>;
}

export function LanguageToggle() {
  const { language, toggleLanguage, content } = useLanguage();
  return <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={language === "en" ? "Switch to Khmer" : "ប្តូរទៅភាសាអង់គ្លេស"}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h12M9 3v2M5 5c0 5 4 9 8 11M13 5c0 5-4 9-9 12M14 21l4-10 4 10M16 17h4" /></svg>
    <span lang={language === "en" ? "km" : "en"}>{content.buttons.language}</span>
  </button>;
}

export function SidebarContact({ onNavigate }: { onNavigate?: () => void }) {
  const { language, content } = useLanguage();
  const contact = content.contact as typeof content.contact & { email?: string; phone?: string };
  const email = contact.email?.trim();
  const phone = contact.phone?.trim();

  if (!email && !phone) return null;

  return <div className="sidebar-contact">
    {email && <a href={`mailto:${email}`} aria-label={`${language === "km" ? "អ៊ីមែល" : "Email"}: ${email}`} onClick={onNavigate}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      <span>{email}</span>
    </a>}
    {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`${language === "km" ? "លេខទូរស័ព្ទ" : "Phone"}: ${phone}`} onClick={onNavigate}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" /></svg>
      <span>{phone}</span>
    </a>}
  </div>;
}

export function SidebarProfile({ onNavigate }: { onNavigate?: () => void }) {
  const { language, content } = useLanguage();
  return <div className="sidebar-profile">
    <Link href="/" direction="back" className="sidebar-avatar" aria-label={content.logo} onClick={onNavigate}>
      <Image src="/images/cheata.jpg" alt={content.hero.imageAlt} width={80} height={80} priority />
    </Link>
    <div className="sidebar-identity">
      <Link href="/" direction="back" className="sidebar-name" onClick={onNavigate}>{content.logo}</Link>
      <p className="sidebar-role">{content.profile.role}</p>
    </div>
    <SidebarContact onNavigate={onNavigate} />
    <p className="sidebar-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg><span>{language === "km" ? "ភ្នំពេញ, កម្ពុជា" : "Phnom Penh, Cambodia"}</span></p>
  </div>;
}

type SidebarProps = {
  id: string;
  collapsed: boolean;
  onClose: () => void;
  closeButtonRef: Ref<HTMLButtonElement>;
};

export default function Sidebar({ id, collapsed, onClose, closeButtonRef }: SidebarProps) {
  const { language } = useLanguage();
  return <aside id={id} className="sidebar" inert={collapsed} aria-hidden={collapsed || undefined} aria-label={language === "km" ? "របារចំហៀង" : "Sidebar"}>
    <button ref={closeButtonRef} className="sidebar-toggle sidebar-close" type="button" aria-controls={id} aria-expanded={!collapsed} aria-label={language === "km" ? "បិទរបារចំហៀង" : "Close sidebar"} onClick={onClose}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
    </button>
    <SidebarProfile />
    <nav className="sidebar-nav" aria-label={language === "km" ? "ការរុករកចម្បង" : "Main navigation"}><NavigationLinks /></nav>
    <div className="sidebar-bottom">
      <nav className="sidebar-socials" aria-label={language === "km" ? "ប្រវត្តិរូបបណ្តាញសង្គម" : "Social profiles"}>
        <a href="https://www.github.com/socheatathai" target="_blank" rel="noopener noreferrer" aria-label={`GitHub (${language === "km" ? "បើកក្នុងផ្ទាំងថ្មី" : "opens in a new tab"})`}><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.64.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" /></svg></a>
        <a href="https://www.linkedin.com/in/socheata-thai-586182289" target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn (${language === "km" ? "បើកក្នុងផ្ទាំងថ្មី" : "opens in a new tab"})`}><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M5.3 7.5a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.5 9h3.6v12H3.5V9Zm5.9 0h3.5v1.6h.1c.5-1 1.7-2 3.5-2 3.7 0 4.5 2.4 4.5 5.5V21h-3.7v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9.4V9Z" /></svg></a>
        <a href="https://t.me/cheata49" target="_blank" rel="noopener noreferrer" aria-label={`Telegram (${language === "km" ? "បើកក្នុងផ្ទាំងថ្មី" : "opens in a new tab"})`}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-4 18-6-6-4 3v-6L3 9l18-6ZM7 12 21 3M11 15 21 3" /></svg></a>
      </nav>
      <div className="sidebar-preferences"><LanguageToggle /><ThemeToggle /></div>
      <p className="sidebar-note">{language === "km" ? "គំនិតល្អៗ ចាប់ផ្តើមដោយការសន្ទនា។" : "Good things start with a conversation."}</p>
    </div>
  </aside>;
}
