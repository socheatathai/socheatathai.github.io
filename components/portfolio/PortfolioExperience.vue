<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioExperienceItem, PortfolioLocaleContent } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioExperience",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    experienceItems: {
      type: Array as PropType<PortfolioExperienceItem[]>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <section id="experience" class="container section">
    <h2>{{ props.normalizeText(props.content.experience?.title || "Work Experience") }}</h2>
    <p class="section-desc">{{ props.normalizeText(props.content.experience?.description || "") }}</p>
    <div class="experience-list">
      <article v-for="item in props.experienceItems" :key="String(item?.company || item?.role)" class="experience-card">
        <div class="experience-head">
          <h3 class="experience-company">{{ props.normalizeText(item?.company) }}</h3>
          <p class="experience-meta">{{ props.normalizeText(`${String(item?.role || "")} • ${String(item?.period || "")}`) }}</p>
        </div>

        <ul class="experience-points">
          <li v-for="detail in (Array.isArray(item?.details) ? item.details : [])" :key="String(detail)">{{ props.normalizeText(detail) }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>
