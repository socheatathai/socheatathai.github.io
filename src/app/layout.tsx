import type { Metadata, Viewport } from "next";
import { ViewTransition, type ReactNode } from "react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteShell from "@/components/layout/SiteShell";
import MobileHeader from "@/components/layout/MobileHeader";
import Footer from "@/components/layout/Footer";
import PageNavigation from "@/components/layout/PageNavigation";
import SkipLink from "@/components/layout/SkipLink";
import { siteName, siteUrl } from "@/lib/site";
import "@/styles/globals.css";
import "@/styles/transitions.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Thai Socheata | Full Stack Developer in Cambodia", template: `%s | ${siteName}` },
  description: "Portfolio of Thai Socheata, a full-stack developer from Cambodia building modern web applications and APIs.",
  authors: [{ name: siteName, url: siteUrl }],
  manifest: "/site.webmanifest",
  icons: { icon: "/images/cheata.jpg", apple: "/images/cheata.jpg" },
  verification: { google: "UzcdJKVxZ2q7jTKoCtEinyg3zOXmAEg1_aMSLUAuRTw" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "km_KH",
    siteName: "Thai Socheata Portfolio",
    images: [{ url: "/images/seo-preview.png", width: 1200, height: 630, alt: "Thai Socheata portfolio" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#f0ece2", colorScheme: "light" };

const themeScript = `(function(){try{var theme=localStorage.getItem('portfolio-theme')==='black'?'black':'paper';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme==='black'?'dark':'light';var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='black'?'#111111':'#f0ece2');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="paper" suppressHydrationWarning>
      <head><script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <SkipLink />
            <ViewTransition default="none">
              <SiteShell>
                <MobileHeader />
                <main className="main-content" id="main-content" tabIndex={-1}>
                  {children}
                  <PageNavigation />
                </main>
                <Footer />
              </SiteShell>
            </ViewTransition>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
