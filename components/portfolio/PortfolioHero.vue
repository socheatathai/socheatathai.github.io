<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioLocaleContent, PortfolioTechnologyItem, PublicPathResolver } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioHero",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    technologies: {
      type: Array as PropType<PortfolioTechnologyItem[]>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    },
    toPublicPath: {
      type: Function as PropType<PublicPathResolver>,
      required: true
    },
    onToggleLanguage: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <section id="home" class="hero container section">
    <div class="profile-box">
      <div class="profile-cover">
        <img src="/images/cheata.jpg" :alt="props.normalizeText(props.content.hero?.imageAlt)" class="profile-img">
      </div>
      <button class="mobile-lang-btn language-toggle" type="button" :aria-label="props.normalizeText(props.content.buttons?.language)" @click="props.onToggleLanguage">
        <span class="language-toggle-text">{{ props.normalizeText(props.content.buttons?.language) }}</span>
      </button>
    </div>

    <div class="hero-content">
      <h1>{{ props.normalizeText(props.content.hero?.title) }}</h1>
      <p>{{ props.normalizeText(props.content.hero?.intro1) }}</p>
      <p>{{ props.normalizeText(props.content.hero?.intro2) }}</p>

      <div class="hero-tools">
        <h3>{{ props.normalizeText(props.content.technologies?.title || "Languages & Tools") }}</h3>
        <div class="tools-grid">
          <span v-for="item in props.technologies" :key="String(item?.name || item?.icon)" class="tool-item" :title="props.normalizeText(item?.name)" :aria-label="props.normalizeText(item?.name || 'Technology')">
            <img class="tool-icon" :src="props.toPublicPath(item?.icon)" :alt="props.normalizeText(item?.name || 'Technology icon')" loading="lazy" decoding="async">
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
