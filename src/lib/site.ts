import type { Metadata } from "next";

export const siteUrl = "https://socheatathai.github.io";
export const siteName = "Thai Socheata";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: path,
      type: "website",
      siteName,
      images: [{ url: "/images/seo-preview.png", width: 1200, height: 630, alt: "Thai Socheata portfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: ["/images/seo-preview.png"],
    },
  };
}
