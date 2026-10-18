"use client";

import Link from "@/components/layout/PageLink";
import PageTransition from "@/components/layout/PageTransition";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFoundContent() {
  const { content } = useLanguage();

  return (
    <PageTransition>
      <div className="not-found">
        <p className="eyebrow">{content.notFound.eyebrow}</p>
        <h1>{content.notFound.title}</h1>
        <p>{content.notFound.description}</p>
        <Link className="button" href="/" direction="back">
          {content.notFound.backHome} <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </PageTransition>
  );
}
