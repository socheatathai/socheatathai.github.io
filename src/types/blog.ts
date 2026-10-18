export type BlogPostText = {
  title: string;
  description: string;
  tags: string[];
};

export type BlogPostMetadata = BlogPostText & {
  slug: string;
  type: "project" | "article";
  date?: string;
  updated?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  projectUrl?: string;
  featured?: boolean;
  km?: BlogPostText;
};

export type BlogPost = {
  metadata: BlogPostMetadata;
  content: string;
  kmContent?: string;
};

export type BlogPageData = {
  posts: BlogPostMetadata[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
};
