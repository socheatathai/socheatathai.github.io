import type { BlogPostMetadata } from "@/types/blog";

export type HomeContentProps = {
  featuredProjects: BlogPostMetadata[];
};

export type ExperienceTimelineProps = {
  compact?: boolean;
};
