"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function SkillsList() {
  const { content } = useLanguage();

  return (
    <ul className="skills-list">
      {content.technologies.items.map((skill) => (
        <li className="skill" key={skill.name}>
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
