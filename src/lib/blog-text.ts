import type { BlogPostMetadata } from "@/types/blog";
import type { Language } from "@/types/language";

export function localizedBlogText(post: BlogPostMetadata, language: Language) {
  return language === "km" && post.km ? post.km : post;
}

export function formatBlogDate(date: string, language: Language): string {
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: language === "km" ? "khmr" : "latn",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
