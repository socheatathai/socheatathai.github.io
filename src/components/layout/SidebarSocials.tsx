"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { SocialIcon } from "./icons";
import type { SocialProfile } from "./types";

const socialProfiles = [
  "github",
  "linkedin",
  "telegram",
] as const satisfies readonly SocialProfile[];

export default function SidebarSocials() {
  const { content } = useLanguage();
  return (
    <nav className="sidebar-socials" aria-label={content.common.socialProfiles}>
      {socialProfiles.map((name) => {
        const field = content.contact.fields.find((field) => field.id === name);
        return (
          field && (
            <a
              key={field.id}
              href={field.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${field.label} (${content.common.opensInNewTab})`}
            >
              <SocialIcon name={name} />
            </a>
          )
        );
      })}
    </nav>
  );
}
