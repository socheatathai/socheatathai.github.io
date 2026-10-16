"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import ExperienceTimeline from "@/components/experience/ExperienceTimeline";
import { skillsByLanguage } from "@/data/skills";

export default function AboutContent() {
  const { language, content } = useLanguage();
  return (
    <>
      <header className="page-header"><p className="eyebrow">{language === "km" ? "អំពីខ្ញុំ" : "A little about me"}</p><h1>{content.about.title}</h1></header>
      <section className="about-grid" aria-label={content.about.title}>
        <div className="about-copy">{content.about.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <dl className="facts">{content.about.facts.map((fact) => <div className="fact" key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
      </section>
      <section className="section" id="experience" aria-labelledby="experience-title"><div className="section-heading"><div><p className="eyebrow">{language === "km" ? "ដំណើរការងារ" : "Professional background"}</p><h2 id="experience-title">{content.experience.title}</h2></div></div><ExperienceTimeline /></section>
      <section className="section" id="education" aria-labelledby="education-title">
        <div className="section-heading"><div><p className="eyebrow">{language === "km" ? "ការសិក្សា" : "Where I learned"}</p><h2 id="education-title">{content.education.title}</h2></div></div>
        <div className="education-list">{content.education.items.map((item) => (
          <article className="education-item" key={item.degree}>
            <Image src={`/${item.logo}`} alt={item.logoAlt} width={56} height={56} />
            <div><p className="timeline-period">{item.period}</p><h3>{item.degree}</h3><p>{"href" in item ? <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.school} (${language === "km" ? "បើកក្នុងផ្ទាំងថ្មី" : "opens in a new tab"})`}>{item.school} <span aria-hidden="true">↗</span></a> : item.school}</p><p>{item.summary}</p></div>
          </article>
        ))}</div>
      </section>
      <section className="section" aria-labelledby="skills-title"><div className="section-heading"><h2 id="skills-title">{content.technologies.title}</h2></div><ul className="skills-list">{skillsByLanguage[language].map((skill) => <li className="skill" key={skill.name}>{skill.name}</li>)}</ul></section>
    </>
  );
}
