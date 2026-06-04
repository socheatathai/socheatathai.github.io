import { computed, ref, type Ref } from "vue";
import contentByLocale from "../public/data/content.json";
import {
  portfolioContentByLocaleSchema,
  portfolioLocaleContentSchema,
  type LocaleCode,
  type PortfolioAboutFact,
  type PortfolioContactField,
  type PortfolioContentByLocale,
  type PortfolioEducationItem,
  type PortfolioExperienceItem,
  type PortfolioLocaleContent,
  type PortfolioProject,
  type PortfolioTechnologyItem,
  type TextValue
} from "../types/portfolio";

const createEmptyLocaleContent = (): PortfolioLocaleContent => ({
  metaDescription: "",
  logo: "",
  nav: {
    home: "",
    projects: "",
    experience: "",
    about: "",
    education: ""
  },
  buttons: {
    theme: "",
    language: "",
    contact: "",
    about: "",
    projectLink: ""
  },
  hero: {
    badge: "",
    title: "",
    mobileTitle: "",
    intro1: "",
    intro2: "",
    imageAlt: ""
  },
  projects: {
    title: "",
    description: "",
    items: []
  },
  experience: {
    title: "",
    description: "",
    items: []
  },
  technologies: {
    title: "",
    items: []
  },
  about: {
    title: "",
    paragraphs: [],
    facts: []
  },
  education: {
    title: "",
    description: "",
    items: []
  },
  contact: {
    title: "",
    description: "",
    fields: []
  },
  footer: ""
});

const fallbackContentByLocale: PortfolioContentByLocale = {
  en: createEmptyLocaleContent(),
  km: createEmptyLocaleContent()
};

const baseContentParse = portfolioContentByLocaleSchema.safeParse(contentByLocale);
const CONTENT_BY_LOCALE: PortfolioContentByLocale = baseContentParse.success ? baseContentParse.data : fallbackContentByLocale;

export const usePortfolioState = (contentSource?: Ref<Partial<PortfolioContentByLocale> | null>) => {
  const locale = ref<LocaleCode>("en");

  const resolveLocaleContent = (nextLocale: LocaleCode): PortfolioLocaleContent => {
    const fetched = contentSource?.value?.[nextLocale];
    if (fetched) {
      const fetchedContentParse = portfolioLocaleContentSchema.safeParse(fetched);
      if (fetchedContentParse.success) {
        return fetchedContentParse.data;
      }
    }

    return CONTENT_BY_LOCALE[nextLocale];
  };

  const content = computed<PortfolioLocaleContent>(() => resolveLocaleContent(locale.value));
  const currentYear = computed(() => new Date().getFullYear());
  const dynamicAge = computed(() => Math.max(0, currentYear.value - 2002));

  const localizeNumbers = (value: TextValue) => {
    const text = String(value ?? "");
    if (locale.value !== "km") {
      return text;
    }

    const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
    return text.replace(/\d/g, (digit) => khmerDigits[Number(digit)] ?? digit);
  };

  const normalizeText = (value: TextValue) => localizeNumbers(String(value ?? ""));

  const projects = computed<PortfolioProject[]>(() => content.value.projects.items);

  const experienceItems = computed<PortfolioExperienceItem[]>(() => content.value.experience.items);

  const technologies = computed<PortfolioTechnologyItem[]>(() => content.value.technologies.items);

  const educationItems = computed<PortfolioEducationItem[]>(() => content.value.education.items);

  const contactFields = computed<PortfolioContactField[]>(() => content.value.contact.fields);

  const aboutParagraphs = computed<string[]>(() => {
    return content.value.about.paragraphs.map((paragraph) => {
      let text = paragraph;

      if (locale.value === "en") {
        text = text.replace(/(I am currently\s+)\d+(\s+years old)/i, `$1${dynamicAge.value}$2`);
      }

      if (locale.value === "km") {
        text = text.replace(/(បច្ចុប្បន្នខ្ញុំមានអាយុ\s*)\d+(\s*ឆ្នាំ)/, `$1${dynamicAge.value}$2`);
      }

      return normalizeText(text);
    });
  });

  const aboutFacts = computed<PortfolioAboutFact[]>(() => {
    return content.value.about.facts.map((fact) => {
      const label = fact.label.trim();
      if (label === "Age" || label === "អាយុ") {
        return {
          ...fact,
          value: String(dynamicAge.value)
        };
      }

      return fact;
    });
  });

  const footerText = computed(() => {
    const footer = String(content.value.footer ?? "");
    const dynamicFooter = footer.replace(/(©\s*)\d{4}/, `$1${currentYear.value}`);
    return normalizeText(dynamicFooter);
  });

  const toPublicPath = (path: string | null | undefined) => {
    const text = String(path ?? "").trim();
    if (!text) {
      return "";
    }

    if (/^https?:\/\//i.test(text) || text.startsWith("/")) {
      return text;
    }

    return `/${text}`;
  };

  const getProjectIconSvg = (iconName: string | null | undefined) => {
    const key = iconName ?? "";
    const icons: Record<string, string> = {
      furniture: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M4 11h16v5H4v-5Zm2 5v2m12-2v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      blockchain: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 8h8v8H8V8Zm-4 4h4m8 0h4m-8-8v4m0 8v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      coffee: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 9h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Zm11 1h2a2 2 0 0 1 0 4h-2M7 5c0 1-1 1.5-1 2.5S7 9 7 10m3-5c0 1-1 1.5-1 2.5S10 9 10 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      pizza: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4c4 0 7.5 1.2 9 3L12 20 3 7c1.5-1.8 5-3 9-3Zm-2.5 6.5h.01M14 9h.01M12 12h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h4v7H4v-7Zm6 4h10v3H10v-3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      portfolio: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8h18v11H3V8Zm5-3h8l1 3H7l1-3Zm1 7h6m-6 3h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    return icons[key] ?? icons.portfolio ?? "";
  };

  const setLocale = (nextLocale: LocaleCode, persist = true) => {
    locale.value = nextLocale;

    if (typeof window === "undefined") {
      return;
    }

    window.document.documentElement.lang = nextLocale;
    if (persist) {
      window.localStorage.setItem("lang", nextLocale);
    }
  };

  const toggleLanguage = () => {
    const nextLocale = locale.value === "en" ? "km" : "en";
    setLocale(nextLocale);
  };

  const initLocale = () => {
    if (typeof window === "undefined") {
      return;
    }

    const savedLang = window.localStorage.getItem("lang");
    if (savedLang === "en" || savedLang === "km") {
      setLocale(savedLang, false);
      return;
    }

    window.document.documentElement.lang = locale.value;
  };

  return {
    locale,
    content,
    projects,
    experienceItems,
    technologies,
    educationItems,
    contactFields,
    aboutParagraphs,
    aboutFacts,
    footerText,
    normalizeText,
    toPublicPath,
    getProjectIconSvg,
    toggleLanguage,
    setLocale,
    initLocale
  };
};
