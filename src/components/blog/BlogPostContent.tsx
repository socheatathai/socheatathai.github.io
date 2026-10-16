import BlogArticle from "./BlogArticle";
import RelatedPosts from "./RelatedPosts";
import ArticlePromo from "./ArticlePromo";
import { getBlogSlugs, getRelatedBlogPosts } from "@/lib/blog";
import { BLOG_PAGE_SIZE, getBlogPageHref } from "@/lib/blog-pagination";
import { compileBlogPost } from "@/lib/blog/mdx";
import { blogPostStructuredData, serializeJsonLd } from "@/lib/structured-data";
import type { BlogPost } from "@/types/blog";

export default async function BlogPostContent({ post }: { post: BlogPost }) {
  const { content, khmerContent } = await compileBlogPost(post);
  const { slug } = post.metadata;
  const listingPage = Math.floor(getBlogSlugs().indexOf(slug) / BLOG_PAGE_SIZE) + 1;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostStructuredData(post.metadata)) }}
      />
      <div className="blog-layout">
        <div className="blog-layout-content">
          <BlogArticle
            metadata={post.metadata}
            khmerContent={khmerContent}
            backHref={getBlogPageHref(listingPage)}
          >
            {content}
          </BlogArticle>
          <RelatedPosts posts={getRelatedBlogPosts(slug)} />
        </div>
        <div className="blog-layout-promo">
          <ArticlePromo />
        </div>
      </div>
    </>
  );
}
