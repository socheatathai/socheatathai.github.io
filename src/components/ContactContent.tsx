"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatLocalizedNumber } from "@/lib/locale";

export default function ContactContent() {
  const { language, content } = useLanguage();
  return (
    <>
      <header className="page-header">
        <p className="eyebrow">{content.contact.eyebrow}</p>
        <h1>{content.contact.title}</h1>
        <p className="lead">{content.contact.description}</p>
      </header>
      <div className="contact-grid">
        {content.contact.fields.map((field, index) => (
          <a
            className="contact-card"
            href={field.href}
            key={field.id}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${field.label}: ${field.handle} (${content.common.opensInNewTab})`}
          >
            <span className="eyebrow">
              {formatLocalizedNumber(index + 1, language, { minimumIntegerDigits: 2 })}
            </span>
            <h2>
              {field.label} <span aria-hidden="true">↗</span>
            </h2>
            <p>{field.handle}</p>
          </a>
        ))}
      </div>
    </>
  );
}
