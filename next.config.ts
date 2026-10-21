import type { NextConfig } from "next";

const pagesBuild = process.env.BUILD_TARGET === "pages";

const nextConfig: NextConfig = {
  // Keep prerendered pages and request-rendered metadata on the same published origin.
  env: { SITE_URL: process.env.SITE_URL ?? "https://socheatathai.github.io" },
  output: pagesBuild ? "export" : "standalone",
  // Each target has a small route entry point; components and content stay shared.
  pageExtensions: [pagesBuild ? "static.tsx" : "server.tsx", "tsx", "ts"],
  outputFileTracingIncludes: {
    "/*": ["./.generated/blog-index.json", "./src/content/blog/**/*.mdx"],
  },
  outputFileTracingExcludes: {
    "/*": [
      "./out/**",
      "./docs/**",
      "./scripts/**",
      "./.git/**",
      "./.aws/**",
      "./.codex/**",
      "./.agents/**",
      "./.env*",
      "./*.tsbuildinfo",
    ],
  },
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
