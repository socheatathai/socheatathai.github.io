import { getBlogSlugs } from "@/lib/blog";

export { default, generateMetadata } from "./page.server";

export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}
