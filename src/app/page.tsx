import HomeContent from "@/components/HomeContent";
import PageTransition from "@/components/layout/PageTransition";
import { getFeaturedProjects } from "@/lib/blog";
import { pageMetadata, siteUrl } from "@/lib/site";

export const metadata = pageMetadata("Full Stack Developer in Cambodia", "Explore Thai Socheata's projects, experience, and writing on building modern web applications.", "/");

const profile = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Thai Socheata",
  alternateName: "Socheata Thai",
  url: siteUrl,
  image: `${siteUrl}/images/cheata.jpg`,
  jobTitle: "Full Stack Developer",
  address: { "@type": "PostalAddress", addressCountry: "Cambodia" },
  sameAs: ["https://github.com/socheatathai", "https://www.linkedin.com/in/socheata-thai-586182289", "https://t.me/cheata49"],
};

export default function HomePage() {
  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      <HomeContent featuredProjects={getFeaturedProjects()} />
    </PageTransition>
  );
}
