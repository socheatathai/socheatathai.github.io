import HomeContent from "@/components/HomeContent";
import PageTransition from "@/components/layout/PageTransition";
import { getFeaturedProjects } from "@/lib/blog";
import { pageMetadata } from "@/lib/metadata";
import { profileStructuredData, serializeJsonLd } from "@/lib/structured-data";

export const metadata = {
  ...pageMetadata(
    "Full Stack Developer in Cambodia",
    "Explore Thai Socheata's projects, experience, and writing on building modern web applications.",
    "/",
  ),
  title: { absolute: "Thai Socheata | Full Stack Developer in Cambodia" },
};

export default function HomePage() {
  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileStructuredData) }}
      />
      <HomeContent featuredProjects={getFeaturedProjects()} />
    </PageTransition>
  );
}
