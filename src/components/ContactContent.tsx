"use client";

import { useLanguage } from "@/components/LanguageProvider";

const handles = ["@cheata49", "socheatathai", "Socheata Thai"];

export default function ContactContent() {
  const { language, content } = useLanguage();
  const numberFormatter = new Intl.NumberFormat(language === "km" ? "km-KH-u-nu-khmr" : "en", { minimumIntegerDigits: 2 });
  return (
    <>
      <header className="page-header"><p className="eyebrow">{language === "km" ? "ភ្ជាប់ទំនាក់ទំនង" : "Let’s connect"}</p><h1>{content.contact.title}</h1><p className="lead">{content.contact.description}</p></header>
      <div className="contact-grid">{content.contact.fields.map((field, index) => (
        <a className="contact-card" href={field.href} key={field.href} target="_blank" rel="noopener noreferrer" aria-label={`${field.label}: ${handles[index]} (${language === "km" ? "បើកក្នុងផ្ទាំងថ្មី" : "opens in a new tab"})`}><span className="eyebrow">{numberFormatter.format(index + 1)}</span><h2>{field.label} <span aria-hidden="true">↗</span></h2><p>{handles[index]}</p></a>
      ))}</div>
    </>
  );
}
