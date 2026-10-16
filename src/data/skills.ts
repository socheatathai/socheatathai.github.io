import content from "../../data/content.json";

export type Skill = {
  name: string;
  icon: string;
};

export const skills: Skill[] = content.en.technologies.items;

export const skillsByLanguage: Record<"en" | "km", Skill[]> = {
  en: skills,
  km: content.km.technologies.items,
};
