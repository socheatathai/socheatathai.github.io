"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "./PageLink";
import { LayoutIcon } from "./icons";
import type { NavigationActionProps, SidebarContactDetails } from "./types";

function SidebarContact({ onNavigate }: NavigationActionProps) {
  const { content } = useLanguage();
  const contact: SidebarContactDetails = content.contact;
  const email = contact.email?.trim();
  const phone = contact.phone?.trim();

  if (!email && !phone) return null;

  return (
    <div className="sidebar-contact">
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label={`${content.common.email}: ${email}`}
          onClick={onNavigate}
        >
          <LayoutIcon name="email" size={17} strokeWidth={1.6} />
          <span>{email}</span>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          aria-label={`${content.common.phone}: ${phone}`}
          onClick={onNavigate}
        >
          <LayoutIcon name="phone" size={17} strokeWidth={1.6} />
          <span>{phone}</span>
        </a>
      )}
    </div>
  );
}

export default function SidebarProfile({ onNavigate }: NavigationActionProps) {
  const { content } = useLanguage();
  return (
    <div className="sidebar-profile">
      <Link
        href="/"
        direction="back"
        className="sidebar-avatar"
        aria-label={content.logo}
        onClick={onNavigate}
      >
        <Image
          src="/images/cheata.jpg"
          alt={content.hero.imageAlt}
          width={80}
          height={80}
          priority
        />
      </Link>
      <div className="sidebar-identity">
        <Link href="/" direction="back" className="sidebar-name" onClick={onNavigate}>
          {content.logo}
        </Link>
        <p className="sidebar-role">{content.profile.role}</p>
      </div>
      <SidebarContact onNavigate={onNavigate} />
      <p className="sidebar-location">
        <LayoutIcon name="location" size={13} strokeWidth={1.8} />
        <span>{content.profile.location}</span>
      </p>
    </div>
  );
}
