"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { ExperienceTimelineProps } from "@/types/portfolio";

export default function ExperienceTimeline({ compact = false }: ExperienceTimelineProps) {
  const { content } = useLanguage();
  return (
    <ol className="timeline">
      {content.experience.items.map((item) => (
        <li className="timeline-item" key={item.company}>
          <div className="timeline-header">
            <div>
              <h3>{item.role}</h3>
              <p className="timeline-company">{item.company}</p>
            </div>
            <p className="timeline-period">{item.period}</p>
          </div>
          <ul className="timeline-details">
            {(compact ? item.details.slice(0, 1) : item.details).map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
