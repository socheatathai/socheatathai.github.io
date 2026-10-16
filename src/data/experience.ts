import content from "../../data/content.json";

export type Experience = {
  company: string;
  role: string;
  period: string;
  details: string[];
};

export const experience: Experience[] = content.en.experience.items;

export const experienceByLanguage: Record<"en" | "km", Experience[]> = {
  en: experience,
  km: content.km.experience.items,
};
