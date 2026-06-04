import { z } from "zod";

export const localeCodeSchema = z.enum(["en", "km"]);

const navSchema = z.object({
  home: z.string(),
  projects: z.string(),
  experience: z.string(),
  about: z.string(),
  education: z.string()
});

const buttonsSchema = z.object({
  theme: z.string().optional().default(""),
  language: z.string(),
  contact: z.string(),
  about: z.string(),
  projectLink: z.string()
});

const heroSchema = z.object({
  badge: z.string(),
  title: z.string(),
  mobileTitle: z.string(),
  intro1: z.string(),
  intro2: z.string(),
  imageAlt: z.string()
});

export const projectIconSchema = z.enum([
  "furniture",
  "blockchain",
  "coffee",
  "pizza",
  "dashboard",
  "portfolio"
]);

export const portfolioProjectSchema = z.object({
  icon: projectIconSchema,
  title: z.string(),
  description: z.string(),
  href: z.string()
});

export const portfolioExperienceItemSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  details: z.array(z.string())
});

export const portfolioTechnologyItemSchema = z.object({
  name: z.string(),
  icon: z.string()
});

export const portfolioAboutFactSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const portfolioEducationItemSchema = z.object({
  degree: z.string(),
  school: z.string(),
  period: z.string(),
  href: z.string().optional(),
  logo: z.string(),
  logoAlt: z.string(),
  summary: z.string()
});

export const portfolioContactFieldSchema = z.object({
  label: z.string(),
  href: z.string().optional(),
  icon: z.string().optional(),
  value: z.string().optional()
});

export const portfolioLocaleContentSchema = z.object({
  metaDescription: z.string(),
  logo: z.string(),
  nav: navSchema,
  buttons: buttonsSchema,
  hero: heroSchema,
  projects: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(portfolioProjectSchema)
  }),
  experience: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(portfolioExperienceItemSchema)
  }),
  technologies: z.object({
    title: z.string(),
    items: z.array(portfolioTechnologyItemSchema)
  }),
  about: z.object({
    title: z.string(),
    paragraphs: z.array(z.string()),
    facts: z.array(portfolioAboutFactSchema)
  }),
  education: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(portfolioEducationItemSchema)
  }),
  contact: z.object({
    title: z.string(),
    description: z.string(),
    fields: z.array(portfolioContactFieldSchema)
  }),
  footer: z.string()
});

export const portfolioContentByLocaleSchema = z.object({
  en: portfolioLocaleContentSchema,
  km: portfolioLocaleContentSchema
});

export type LocaleCode = z.infer<typeof localeCodeSchema>;
export type ProjectIconName = z.infer<typeof projectIconSchema>;
export type PortfolioProject = z.infer<typeof portfolioProjectSchema>;
export type PortfolioExperienceItem = z.infer<typeof portfolioExperienceItemSchema>;
export type PortfolioTechnologyItem = z.infer<typeof portfolioTechnologyItemSchema>;
export type PortfolioAboutFact = z.infer<typeof portfolioAboutFactSchema>;
export type PortfolioEducationItem = z.infer<typeof portfolioEducationItemSchema>;
export type PortfolioContactField = z.infer<typeof portfolioContactFieldSchema>;
export type PortfolioLocaleContent = z.infer<typeof portfolioLocaleContentSchema>;
export type PortfolioContentByLocale = z.infer<typeof portfolioContentByLocaleSchema>;

export type TextValue = string | number | null | undefined;
export type NormalizeText = (value: TextValue) => string;
export type PublicPathResolver = (path: string | null | undefined) => string;
export type ProjectIconResolver = (iconName: string | null | undefined) => string;
