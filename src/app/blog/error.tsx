"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function BlogError({ reset }: { error: Error; reset: () => void }) {
  const { content } = useLanguage();
  return (
    <div className="empty-state" role="alert">
      <p>{content.blog.searchError}</p>
      <button className="button" type="button" onClick={reset}>
        {content.blog.retry}
      </button>
    </div>
  );
}
