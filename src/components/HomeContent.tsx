"use client";

import Image from "next/image";
import Link from "@/components/layout/PageLink";
import { useLanguage } from "@/components/LanguageProvider";
import { localizedBlogText } from "@/components/blog/blogText";
import ExperienceTimeline from "@/components/experience/ExperienceTimeline";
import { skillsByLanguage } from "@/data/skills";
import type { BlogPostMetadata } from "@/lib/blog";

export default function HomeContent({ featuredProjects }: { featuredProjects: BlogPostMetadata[] }) {
  const { language, content } = useLanguage();
  const km = language === "km";

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{content.profile.role} · {km ? "កម្ពុជា" : "Cambodia"}</p>
          <h1 id="hero-title">{content.hero.title}<span aria-hidden="true">.</span></h1>
          <p className="lead">{content.hero.intro1}</p>
          <p>{content.hero.intro2}</p>
        </div>
        <div className="hero-portrait">
          <Image src="/images/cheata.jpg" alt={content.hero.imageAlt} width={320} height={380} priority sizes="(max-width: 760px) 180px, 260px" />
        </div>
      </section>

      <section className="section" aria-labelledby="featured-projects">
        <div className="section-heading">
          <div><p className="eyebrow">{km ? "ស្នាដៃ" : "Selected work"}</p><h2 id="featured-projects">{content.projects.title}</h2></div>
          <Link className="text-link" href="/blog/">{km ? "គម្រោងទាំងអស់" : "All projects"} <span aria-hidden="true">↗</span></Link>
        </div>
        <ul className="home-project-list">
          {featuredProjects.map((project) => {
            const text = localizedBlogText(project, language);
            return (
              <li className="home-project-item" key={project.slug}>
                <Link className="home-project-link" href={`/blog/${project.slug}/`}>
                  <h3 className="home-project-title">{text.title}<span className="home-project-arrow" aria-hidden="true">↗</span></h3>
                  <p className="home-project-description">{text.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section" id="experience" aria-labelledby="experience-title">
        <div className="section-heading"><div><p className="eyebrow">{km ? "ដំណើរការងារ" : "The journey so far"}</p><h2 id="experience-title">{content.experience.title}</h2></div></div>
        <ExperienceTimeline compact />
        <Link className="text-link" href="/about/#experience">{km ? "អំពីខ្ញុំបន្ថែម" : "More about my experience"} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="section" aria-labelledby="skills-title">
        <div className="section-heading"><div><p className="eyebrow">{km ? "ឧបករណ៍ដែលខ្ញុំប្រើ" : "My toolkit"}</p><h2 id="skills-title">{content.technologies.title}</h2></div></div>
        <ul className="skills-list">{skillsByLanguage[language].map((skill) => <li className="skill" key={skill.name}>{skill.name}</li>)}</ul>
      </section>
    </>
  );
}
