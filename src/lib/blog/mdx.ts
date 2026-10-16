import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/blog/CodeBlock";
import type { BlogPost } from "@/types/blog";

function compileArticle(source: string) {
  return compileMDX({
    source,
    components: { pre: CodeBlock },
    // Local, reviewed content only. Keep MDX expressions and dynamic imports disabled.
    options: {
      blockJS: true,
      mdxOptions: { useDynamicImport: false, remarkPlugins: [remarkGfm] },
    },
  });
}

export async function compileBlogPost(post: BlogPost) {
  const [article, khmerArticle] = await Promise.all([
    compileArticle(post.content),
    post.kmContent ? compileArticle(post.kmContent) : Promise.resolve(null),
  ]);
  return { content: article.content, khmerContent: khmerArticle?.content };
}
