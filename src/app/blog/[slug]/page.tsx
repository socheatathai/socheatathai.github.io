import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/blog/CodeBlock";
import BlogArticle from "@/components/blog/BlogArticle";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ArticlePromo from "@/components/blog/ArticlePromo";
import { getBlogPost, getBlogSlugs, getRelatedBlogPosts } from "@/lib/blog";
import { BLOG_PAGE_SIZE, getBlogPageHref } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const entry = post.metadata;

  const metadata = pageMetadata(entry.title, entry.description, `/blog/${slug}/`);
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      ...(entry.date ? { publishedTime: `${entry.date}T00:00:00Z` } : {}),
      authors: ["Thai Socheata"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const compileArticle = (source: string) => compileMDX({
    source,
    components: { pre: CodeBlock },
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });
  const [article, khmerArticle] = await Promise.all([
    compileArticle(post.content),
    post.kmContent ? compileArticle(post.kmContent) : Promise.resolve(null),
  ]);
  const listingPage = Math.floor(getBlogSlugs().indexOf(slug) / BLOG_PAGE_SIZE) + 1;

  return (
    <PageTransition key={slug}>
      <div className="blog-layout">
        <div className="blog-layout-content">
          <BlogArticle metadata={post.metadata} khmerContent={khmerArticle?.content} backHref={getBlogPageHref(listingPage)}>
            {article.content}
          </BlogArticle>
          <RelatedPosts posts={getRelatedBlogPosts(slug)} />
        </div>
        <div className="blog-layout-promo"><ArticlePromo /></div>
      </div>
    </PageTransition>
  );
}
