import { notFound } from "next/navigation";
import { getBlogPage, getBlogPost } from "@/lib/blog";

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
