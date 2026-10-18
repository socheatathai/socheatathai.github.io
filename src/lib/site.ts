const configuredUrl = new URL(process.env.SITE_URL ?? "https://socheatathai.github.io");
if (
  !["https:", "http:"].includes(configuredUrl.protocol) ||
  configuredUrl.username ||
  configuredUrl.password ||
  configuredUrl.pathname !== "/" ||
  configuredUrl.search ||
  configuredUrl.hash
)
  throw new Error(
    "SITE_URL must be an absolute HTTP(S) origin without credentials, a path, or query parameters.",
  );

export const siteUrl = configuredUrl.origin;
export const siteName = "Thai Socheata";
export const defaultSocialImage = "/images/seo-preview.png";
