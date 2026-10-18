import type { Metadata, Viewport } from "next";
import { ViewTransition, type ReactNode } from "react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteShell from "@/components/layout/SiteShell";
import MobileHeader from "@/components/layout/MobileHeader";
import Footer from "@/components/layout/Footer";
import PageNavigation from "@/components/layout/PageNavigation";
import SkipLink from "@/components/layout/SkipLink";
import { rootMetadata, siteViewport } from "@/lib/metadata";
import { themeScript } from "@/lib/theme";
import "@/styles/globals.css";
import "@/styles/transitions.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = siteViewport;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="paper" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
