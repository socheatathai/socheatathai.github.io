"use client";

import { useEffect, useId, useState, type FocusEvent } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "@/components/layout/PageLink";
import styles from "./ArticlePromo.module.css";

type ServiceName = "web" | "api" | "database" | "deploy";

function ServiceIcon({ name }: { name: ServiceName }) {
  const paths = {
    web: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13l-2 2 2 2M17 13l2 2-2 2M13 12l-2 6" /></>,
    api: <><path d="m8 5-6 7 6 7M16 5l6 7-6 7M14 3l-4 18" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
    deploy: <><path d="M7 16H5a3 3 0 0 1-.5-6A6 6 0 0 1 16 7a4.5 4.5 0 0 1 3 8.4M12 21V11M8 15l4-4 4 4" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function ArticlePromo() {
  const { language } = useLanguage();
  const isKhmer = language === "km";
  const carouselId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const rotating = desktop && !dismissed && !paused && !hovered && !focused && !reducedMotion;

  useEffect(() => {
    const viewport = window.matchMedia("(min-width: 1280px)");
    setDesktop(viewport.matches);
    function updateViewport(event: MediaQueryListEvent) {
      setDesktop(event.matches);
      if (!event.matches) {
        setHovered(false);
        setFocused(false);
      }
    }
    viewport.addEventListener("change", updateViewport);
    return () => viewport.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(preference.matches);
    function updatePreference(event: MediaQueryListEvent) {
      setReducedMotion(event.matches);
    }
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timeout = window.setTimeout(() => setActiveSlide((value) => (value + 1) % 2), 6000);
    return () => window.clearTimeout(timeout);
  }, [activeSlide, rotating]);

  function onBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }

  function dismiss() {
    setDismissed(true);
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }

  if (dismissed) return null;

  const slideNames = isKhmer ? ["សម្រេចគំនិតរបស់អ្នកជាមួយខ្ញុំ", "ពាណិជ្ជកម្ម"] : ["Build your idea with me", "Ads"];
  const services: { name: ServiceName; label: string }[] = [
    { name: "web", label: isKhmer ? "កម្មវិធីវេប" : "Web applications" },
    { name: "api", label: isKhmer ? "ការអភិវឌ្ឍ API" : "API development" },
    { name: "database", label: isKhmer ? "ការរចនាមូលដ្ឋានទិន្នន័យ" : "Database design" },
    { name: "deploy", label: isKhmer ? "ការដាក់ឱ្យដំណើរការ និង DevOps" : "Deployment & DevOps" },
  ];
  const rotationLabel = reducedMotion
    ? (isKhmer ? "ការប្តូរស្លាយស្វ័យប្រវត្តិត្រូវបានបិទ ដោយសារការកំណត់កាត់បន្ថយចលនា" : "Automatic slides are off with reduced motion")
    : paused
      ? (isKhmer ? "បន្តការប្តូរស្លាយស្វ័យប្រវត្តិ" : "Play automatic slides")
      : (isKhmer ? "ផ្អាកការប្តូរស្លាយស្វ័យប្រវត្តិ" : "Pause automatic slides");

  return <aside className={styles.promo} aria-label={isKhmer ? "ការងារ និងពាណិជ្ជកម្ម" : "Work and ads"} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={onBlur}>
    <div className={styles.header}>
      <span className={styles.badge}><span className={styles.statusDot} aria-hidden="true" />{isKhmer ? "បើកទទួលការងារ" : "Open to work"}</span>
      <button className={styles.iconButton} type="button" onClick={dismiss} aria-label={isKhmer ? "បិទប្រអប់ការងារ និងពាណិជ្ជកម្ម" : "Close work and ads box"}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
      </button>
    </div>
    <div id={carouselId} className={styles.viewport} role="region" aria-roledescription={isKhmer ? "ស្លាយប្តូរវេន" : "carousel"} aria-label={isKhmer ? "តំណពិសេស" : "Featured links"}>
      <div className={styles.track} style={{ transform: `translateX(-${activeSlide * 100}%)` }} aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        <div className={styles.slide} role="group" aria-roledescription={isKhmer ? "ស្លាយ" : "slide"} aria-label={isKhmer ? "១ ក្នុងចំណោម ២" : "1 of 2"} aria-hidden={activeSlide !== 0} inert={activeSlide !== 0}>
          <h2 className={styles.title}>{slideNames[0]}</h2>
          <p className={styles.description}>{isKhmer ? "បើកទទួលគម្រោងឯករាជ្យ និងឱកាសការងារនៅការិយាល័យ។" : "Open to freelance projects and on-site opportunities."}</p>
          <ul className={styles.services}>
            {services.map(({ name, label }) => <li key={name}><ServiceIcon name={name} /><span>{label}</span></li>)}
          </ul>
          <Link href="/contact/" className={styles.contact}>{isKhmer ? "ចាប់ផ្តើមគម្រោង" : "Start a project"}<span aria-hidden="true">→</span></Link>
        </div>
        <div className={`${styles.slide} ${styles.adSlide}`} role="group" aria-roledescription={isKhmer ? "ស្លាយ" : "slide"} aria-label={isKhmer ? "២ ក្នុងចំណោម ២" : "2 of 2"} aria-hidden={activeSlide !== 1} inert={activeSlide !== 1}>
          <div className={styles.adContent}>
            <span className={styles.adIcon} aria-hidden="true"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01m-4 9 3-3 3 3 2-2 3 3" /></svg></span>
            <h2 className={styles.title}>{slideNames[1]}</h2>
            <p className={styles.description}>{isKhmer ? "ទីតាំងផ្សាយពាណិជ្ជកម្ម។" : "Advertisement space."}</p>
          </div>
          <Link href="/contact/" className={styles.contact}>{isKhmer ? "ទាក់ទងខ្ញុំ" : "Get in touch"}<span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </div>
    <div className={styles.controls}>
      <div className={styles.pagination} aria-label={isKhmer ? "ជ្រើសរើសស្លាយ" : "Choose a slide"}>
        {slideNames.map((name, index) => <button key={index} className={styles.dotButton} type="button" aria-controls={carouselId} aria-label={isKhmer ? `បង្ហាញស្លាយ ${index + 1}៖ ${name}` : `Show slide ${index + 1}: ${name}`} aria-current={activeSlide === index ? "true" : undefined} onClick={() => setActiveSlide(index)}><span className={`${styles.dot}${activeSlide === index ? ` ${styles.activeDot}` : ""}`} /></button>)}
      </div>
      <button className={styles.iconButton} type="button" aria-controls={carouselId} aria-label={rotationLabel} title={rotationLabel} disabled={reducedMotion} onClick={() => setPaused((value) => !value)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paused || reducedMotion ? <path d="m8 5 11 7-11 7V5Z" /> : <><path d="M8 5v14M16 5v14" /></>}</svg>
      </button>
    </div>
    <figure className={styles.illustration}>
      <Image src="/images/work-illustration.webp" width={640} height={400} alt="" />
      <figcaption>{isKhmer ? "តោះបង្កើតអ្វីដែលមានប្រយោជន៍។" : "Let’s build something useful."}</figcaption>
    </figure>
  </aside>;
}
