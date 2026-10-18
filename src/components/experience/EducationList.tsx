"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";

export default function EducationList() {
  const { content } = useLanguage();

  return (
    <div className="education-list">
      {content.education.items.map((item) => (
        <article className="education-item" key={item.degree}>
          <Image src={`/${item.logo}`} alt={item.logoAlt} width={56} height={56} />
          <div>
            <p className="timeline-period">{item.period}</p>
            <h3>{item.degree}</h3>
            <p>
              {"href" in item ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.school} (${content.common.opensInNewTab})`}
                >
                  {item.school} <span aria-hidden="true">↗</span>
                </a>
              ) : (
                item.school
              )}
            </p>
            <p>{item.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
