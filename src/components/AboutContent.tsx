"use client";

import { useLanguage } from "@/components/LanguageProvider";
import SkillsList from "@/components/SkillsList";
import EducationList from "@/components/experience/EducationList";
import ExperienceTimeline from "@/components/experience/ExperienceTimeline";

export default function AboutContent() {
  const { content } = useLanguage();
  return (
    <>
      <header className="page-header">
        <p className="eyebrow">{content.about.eyebrow}</p>
        <h1>{content.about.title}</h1>
      </header>
      <section className="about-grid" aria-label={content.about.title}>
        <div className="about-copy">
          {content.about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="facts">
          {content.about.facts.map((fact) => (
            <div className="fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="section" id="experience" aria-labelledby="experience-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{content.about.experienceEyebrow}</p>
            <h2 id="experience-title">{content.experience.title}</h2>
          </div>
        </div>
        <ExperienceTimeline />
      </section>
      <section className="section" id="education" aria-labelledby="education-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{content.about.educationEyebrow}</p>
            <h2 id="education-title">{content.education.title}</h2>
          </div>
        </div>
        <EducationList />
      </section>
      <section className="section" aria-labelledby="skills-title">
        <div className="section-heading">
          <h2 id="skills-title">{content.technologies.title}</h2>
        </div>
        <SkillsList />
      </section>
    </>
  );
}
