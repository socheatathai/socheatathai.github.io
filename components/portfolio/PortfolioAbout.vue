<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioAboutFact, PortfolioLocaleContent } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioAbout",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    aboutParagraphs: {
      type: Array as PropType<string[]>,
      required: true
    },
    aboutFacts: {
      type: Array as PropType<PortfolioAboutFact[]>,
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
  <section id="about" class="container section">
    <h2>{{ props.normalizeText(props.content.about?.title) }}</h2>
    <div class="info-box">
      <p v-for="(paragraph, index) in props.aboutParagraphs" :key="`about-${index}`">{{ paragraph }}</p>

      <ul class="profile-info">
        <li v-for="fact in props.aboutFacts" :key="String(fact?.label)">
          <strong>{{ props.normalizeText(fact?.label) }}:</strong>
          {{ ` ${props.normalizeText(fact?.value)}` }}
        </li>
      </ul>
    </div>
  </section>
</template>
