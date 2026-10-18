import { notFound } from "next/navigation";
import { getBlogPage, getBlogPost, getBlogMetadata } from "@/lib/blog";

export function getBlogMetadataOrNotFound(slug: string) {
  const metadata = getBlogMetadata(slug);
  if (!metadata) notFound();
  return metadata;
}

export function getBlogPostOrNotFound(slug: string) {
  const post = getBlogPost(slug);
  if (!post) notFound();
  return post;
}

export function getBlogPageOrNotFound(value: string) {
  if (!/^[1-9]\d*$/.test(value)) notFound();
  const page = getBlogPage(Number(value));
  if (!page) notFound();
  return page;
}
