<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePortfolioState } from "../composables/usePortfolioState";
import type { LocaleCode, PortfolioContentByLocale } from "../types/portfolio";

const {
  data: contentByLocale,
  pending: isContentPending,
  error: contentError
} = await useFetch<Partial<PortfolioContentByLocale>>("/data/content.json", {
  key: "portfolio-content",
  default: () => ({})
});

const { locale: i18nLocale } = useI18n();
const portfolio = usePortfolioState(contentByLocale);

const {
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
  setLocale
} = portfolio;

const contactHrefPattern = /^(https?:\/\/|mailto:|tel:)/i;

const sanitizedContactFields = computed(() => {
  return contactFields.value.filter((field) => {
    const label = String(field?.label ?? "").trim();
    const href = String(field?.href ?? "").trim();
    const value = String(field?.value ?? "").trim();

    if (!label) {
      return false;
    }

    if (href) {
      return contactHrefPattern.test(href);
    }

    return value.length > 0;
  });
});

const showContentFallbackNotice = computed(() => {
  return Boolean(contentError.value) && !isContentPending.value;
});

const localeCookie = useCookie<LocaleCode>("lang", {
  default: () => "en",
  sameSite: "lax"
}) as { value: LocaleCode };

if (localeCookie.value === "en" || localeCookie.value === "km") {
  setLocale(localeCookie.value, false);
}

watch(
  locale,
  (value: LocaleCode) => {
    if (value === "en" || value === "km") {
      localeCookie.value = value;
    }

    if (i18nLocale.value !== value) {
      i18nLocale.value = value;
    }
  },
  { immediate: true }
);

watch(i18nLocale, (value: LocaleCode) => {
  if ((value === "en" || value === "km") && locale.value !== value) {
    setLocale(value as LocaleCode, false);
  }
});

useHead(() => ({
  htmlAttrs: {
    lang: locale.value
  },
  meta: [
    {
      name: "description",
      content: String(content.value.metaDescription ?? "")
    }
  ]
}));
</script>

<template>
  <div>
    <PortfolioBackgroundIcons />
    <PortfolioHeader :content="content" :normalize-text="normalizeText" :on-toggle-language="toggleLanguage" />
    <!-- <p v-if="showContentFallbackNotice" class="container section-desc">Unable to load remote content. Showing local fallback content.</p> -->

    <main>
      <PortfolioHero :content="content" :technologies="technologies" :normalize-text="normalizeText" :to-public-path="toPublicPath" :on-toggle-language="toggleLanguage" />
      <PortfolioProjects :content="content" :projects="projects" :normalize-text="normalizeText" :get-project-icon-svg="getProjectIconSvg" />
      <PortfolioExperience :content="content" :experience-items="experienceItems" :normalize-text="normalizeText" />
      <PortfolioAbout :content="content" :about-paragraphs="aboutParagraphs" :about-facts="aboutFacts" :normalize-text="normalizeText" />
      <PortfolioEducation :content="content" :education-items="educationItems" :normalize-text="normalizeText" :to-public-path="toPublicPath" />
      <PortfolioContact :content="content" :contact-fields="sanitizedContactFields" :normalize-text="normalizeText" :to-public-path="toPublicPath" />
    </main>

    <PortfolioFooter :footer-text="footerText" />
  </div>
</template>
