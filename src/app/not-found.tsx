import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "This page could not be found. Explore Thai Socheata's blog or return to the home page.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
