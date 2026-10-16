import ContactContent from "@/components/ContactContent";
import PageTransition from "@/components/layout/PageTransition";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Contact", "Connect with Thai Socheata on Telegram, GitHub, or LinkedIn.", "/contact/");

export default function ContactPage() {
  return <PageTransition><ContactContent /></PageTransition>;
}
