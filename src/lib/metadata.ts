import type { Metadata, Viewport } from "next";
import type { BlogPostMetadata } from "@/types/blog";
import { getBlogPageHref } from "./blog-pagination";
import { themeSettings } from "./theme";
import { defaultSocialImage, siteName, siteUrl } from "./site";

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Thai Socheata | Full Stack Developer in Cambodia",
    template: `%s | ${siteName}`,
  },
  description:
    "Portfolio of Thai Socheata, a full-stack developer from Cambodia building modern web applications and APIs.",
  authors: [{ name: siteName, url: siteUrl }],
  referrer: "strict-origin-when-cross-origin",
  manifest: "/site.webmanifest",
  icons: {
    icon: { url: "/images/icon-192.png", type: "image/png", sizes: "192x192" },
    apple: "/images/icon-192.png",
  },
  verification: { google: "UzcdJKVxZ2q7jTKoCtEinyg3zOXmAEg1_aMSLUAuRTw" },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "km_KH",
    siteName: "Thai Socheata Portfolio",
    images: [
      { url: "/images/seo-preview.png", width: 1200, height: 630, alt: "Thai Socheata portfolio" },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export const siteViewport: Viewport = {
  themeColor: themeSettings.paper.color,
  colorScheme: themeSettings.paper.colorScheme,
};

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
      images: [
        { url: defaultSocialImage, width: 1200, height: 630, alt: "Thai Socheata portfolio" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [defaultSocialImage],
    },
  };
}

export function blogIndexMetadata(page = 1): Metadata {
  return pageMetadata(
    page === 1 ? "Blog" : `Blog · Page ${page}`,
    "Project notes, development examples, and tutorials from Thai Socheata.",
    getBlogPageHref(page),
  );
}

export function blogPostMetadata(post: BlogPostMetadata): Metadata {
  const metadata = pageMetadata(post.title, post.description, `/blog/${post.slug}/`);
  const image = post.image ?? defaultSocialImage;
  return {
    ...metadata,
    authors: [{ name: siteName, url: `${siteUrl}/about/` }],
    keywords: post.tags,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      ...(post.date ? { publishedTime: `${post.date}T00:00:00+07:00` } : {}),
      ...(post.updated ? { modifiedTime: `${post.updated}T00:00:00+07:00` } : {}),
      authors: [`${siteUrl}/about/`],
      tags: post.tags,
      images: [
        {
          url: image,
          width: post.image ? post.imageWidth : 1200,
          height: post.image ? post.imageHeight : 630,
          alt: post.image ? post.title : "Thai Socheata portfolio",
        },
      ],
    },
    twitter: { ...metadata.twitter, images: [{ url: image, alt: post.title }] },
  };
}
