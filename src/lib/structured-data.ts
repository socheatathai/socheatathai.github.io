import type { BlogPostMetadata } from "@/types/blog";
import { defaultSocialImage, siteName, siteUrl } from "./site";

/** Keep JSON data from terminating an HTML script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const profileStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Thai Socheata",
  alternateName: "Socheata Thai",
  url: siteUrl,
  image: `${siteUrl}/images/cheata.jpg`,
  jobTitle: "Full Stack Developer",
  address: { "@type": "PostalAddress", addressCountry: "Cambodia" },
  sameAs: [
    "https://github.com/socheatathai",
    "https://www.linkedin.com/in/socheata-thai-586182289",
    "https://t.me/cheata49",
  ],
};

export function blogPostStructuredData(post: BlogPostMetadata) {
  const url = `${siteUrl}/blog/${post.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: post.title,
        description: post.description,
        image: [new URL(post.image ?? defaultSocialImage, siteUrl).href],
        ...(post.date ? { datePublished: `${post.date}T00:00:00+07:00` } : {}),
        ...(post.updated ? { dateModified: `${post.updated}T00:00:00+07:00` } : {}),
        author: { "@type": "Person", name: siteName, url: `${siteUrl}/about/` },
        inLanguage: "en",
        keywords: post.tags,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog/` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}
