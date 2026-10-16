import AboutContent from "@/components/AboutContent";
import PageTransition from "@/components/layout/PageTransition";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("About", "Get to know Thai Socheata: full-stack developer from Cambodia, professional experience, education, and technical skills.", "/about/");

export default function AboutPage() {
  return <PageTransition><AboutContent /></PageTransition>;
}
