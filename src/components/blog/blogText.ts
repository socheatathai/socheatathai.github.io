import type { BlogPostMetadata } from "@/lib/blog";

export function localizedBlogText(post: BlogPostMetadata, language: "en" | "km") {
  return language === "km" && post.km ? post.km : post;
}

export function formatBlogDate(date: string, language: "en" | "km"): string {
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: language === "km" ? "khmr" : "latn",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
