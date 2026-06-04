<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioEducationItem, PortfolioLocaleContent, PublicPathResolver } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioEducation",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    educationItems: {
      type: Array as PropType<PortfolioEducationItem[]>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    },
    toPublicPath: {
      type: Function as PropType<PublicPathResolver>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <section id="education" class="container section">
    <h2>{{ props.normalizeText(props.content.education?.title || "Education") }}</h2>
    <p class="section-desc">{{ props.normalizeText(props.content.education?.description || "") }}</p>
    <div class="education-list">
      <article v-for="item in props.educationItems" :key="String(item?.degree || item?.school)" class="education-card">
        <h3 class="education-degree">{{ props.normalizeText(item?.degree) }}</h3>

        <div class="education-school-row">
          <component :is="item?.href ? 'a' : 'span'" class="education-school-logo-link" :href="item?.href ? String(item.href) : undefined" :target="item?.href ? '_blank' : undefined" :rel="item?.href ? 'noopener noreferrer' : undefined" :aria-label="item?.href ? `${props.normalizeText(item?.school || 'School')} website` : undefined">
            <img class="education-school-logo" :src="props.toPublicPath(item?.logo)" :alt="props.normalizeText(item?.logoAlt || `${String(item?.school || 'School')} logo`)" loading="lazy" decoding="async">
          </component>

          <p class="education-school">{{ props.normalizeText(item?.school) }}</p>
        </div>

        <p class="education-period">{{ props.normalizeText(item?.period) }}</p>
        <p class="education-summary">{{ props.normalizeText(item?.summary) }}</p>
      </article>
    </div>
  </section>
</template>
