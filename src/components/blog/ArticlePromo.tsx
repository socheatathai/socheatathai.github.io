"use client";

import { useId } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "@/components/layout/PageLink";
import { useArticlePromo } from "@/hooks/useArticlePromo";
import styles from "./ArticlePromo.module.css";

type ServiceName = "web" | "api" | "database" | "deploy";

function ServiceIcon({ name }: { name: ServiceName }) {
  const paths = {
    web: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13l-2 2 2 2M17 13l2 2-2 2M13 12l-2 6" />
      </>
    ),
    api: (
      <>
        <path d="m8 5-6 7 6 7M16 5l6 7-6 7M14 3l-4 18" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    ),
    deploy: (
      <>
        <path d="M7 16H5a3 3 0 0 1-.5-6A6 6 0 0 1 16 7a4.5 4.5 0 0 1 3 8.4M12 21V11M8 15l4-4 4 4" />
      </>
    ),
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function ArticlePromo() {
  const { content } = useLanguage();
  const carouselId = useId();
  const slideNames = [content.promo.workTitle, content.promo.adTitle];
  const {
    dismissed,
    activeSlide,
    paused,
    reducedMotion,
    rotating,
    selectSlide,
    togglePaused,
    dismiss,
    interactionProps,
  } = useArticlePromo(slideNames.length);

  if (dismissed) return null;

  const services: { name: ServiceName; label: string }[] = [
    { name: "web", label: content.promo.web },
    { name: "api", label: content.promo.api },
    { name: "database", label: content.promo.database },
    { name: "deploy", label: content.promo.deploy },
  ];
  const rotationLabel = reducedMotion
    ? content.promo.reducedMotion
    : paused
      ? content.promo.play
      : content.promo.pause;

  return (
    <aside className={styles.promo} aria-label={content.promo.label} {...interactionProps}>
      <div className={styles.header}>
        <span className={styles.badge}>
          <span className={styles.statusDot} aria-hidden="true" />
          {content.promo.status}
        </span>
        <button
          className={styles.iconButton}
          type="button"
          onClick={dismiss}
          aria-label={content.promo.close}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </div>
      <div
        id={carouselId}
        className={styles.viewport}
        role="region"
        aria-roledescription={content.promo.carouselRole}
        aria-label={content.promo.featuredLinks}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          aria-live={rotating ? "off" : "polite"}
          aria-atomic="true"
        >
          <div
            className={styles.slide}
            role="group"
            aria-roledescription={content.promo.slideRole}
            aria-label={content.promo.firstSlide}
            aria-hidden={activeSlide !== 0}
            inert={activeSlide !== 0}
          >
            <h2 className={styles.title}>{slideNames[0]}</h2>
            <p className={styles.description}>{content.promo.workDescription}</p>
            <ul className={styles.services}>
              {services.map(({ name, label }) => (
                <li key={name}>
                  <ServiceIcon name={name} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link href="/contact/" className={styles.contact}>
              {content.promo.startProject}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div
            className={`${styles.slide} ${styles.adSlide}`}
            role="group"
            aria-roledescription={content.promo.slideRole}
            aria-label={content.promo.secondSlide}
            aria-hidden={activeSlide !== 1}
            inert={activeSlide !== 1}
          >
            <div className={styles.adContent}>
              <span className={styles.adIcon} aria-hidden="true">
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M7 6.5h.01M10 6.5h.01m-4 9 3-3 3 3 2-2 3 3" />
                </svg>
              </span>
              <h2 className={styles.title}>{slideNames[1]}</h2>
              <p className={styles.description}>{content.promo.adDescription}</p>
            </div>
            <Link href="/contact/" className={styles.contact}>
              {content.promo.getInTouch}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.pagination} aria-label={content.promo.chooseSlide}>
          {slideNames.map((name, index) => (
            <button
              key={index}
              className={styles.dotButton}
              type="button"
              aria-controls={carouselId}
              aria-label={content.promo.showSlide
                .replace("{number}", String(index + 1))
                .replace("{name}", name)}
              aria-current={activeSlide === index ? "true" : undefined}
              onClick={() => selectSlide(index)}
            >
              <span
                className={`${styles.dot}${activeSlide === index ? ` ${styles.activeDot}` : ""}`}
              />
            </button>
          ))}
        </div>
        <button
          className={styles.iconButton}
          type="button"
          aria-controls={carouselId}
          aria-label={rotationLabel}
          title={rotationLabel}
          disabled={reducedMotion}
          onClick={togglePaused}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {paused || reducedMotion ? (
              <path d="m8 5 11 7-11 7V5Z" />
            ) : (
              <>
                <path d="M8 5v14M16 5v14" />
              </>
            )}
          </svg>
        </button>
      </div>
      <figure className={styles.illustration}>
        <Image src="/images/work-illustration.webp" width={640} height={400} alt="" />
        <figcaption>{content.promo.caption}</figcaption>
      </figure>
    </aside>
  );
}
