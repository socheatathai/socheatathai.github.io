import StaticBlogContent from "@/components/blog/StaticBlogContent";
import PageTransition from "@/components/layout/PageTransition";
import { getBlogPage, getBlogPosts, getBlogRevision, getBlogTagOptions } from "@/lib/blog";
import { blogIndexMetadata } from "@/lib/metadata";

export const dynamic = "force-static";
export const metadata = blogIndexMetadata(1);

export default function StaticBlogPage() {
  const page = getBlogPage(1)!;
  return (
    <PageTransition>
      <StaticBlogContent
        {...page}
        criteria={{ query: "", tag: null, sort: "latest", language: "en", page: 1 }}
        tags={getBlogTagOptions()}
        archiveTotal={getBlogPosts().length}
        manifestUrl={`/blog-search/${getBlogRevision()}/manifest.json`}
      />
    </PageTransition>
  );
}
