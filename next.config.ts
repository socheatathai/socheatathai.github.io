import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep prerendered pages and request-rendered metadata on the same published origin.
  env: { SITE_URL: process.env.SITE_URL ?? "https://socheatathai.github.io" },
  output: "standalone",
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
